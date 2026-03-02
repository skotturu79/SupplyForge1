import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentEncryptionService } from './document-encryption.service';
import type { DocumentSearch } from '@supplyforge/validators';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: DocumentEncryptionService,
    @InjectQueue('document-events') private readonly docQueue: Queue,
    @InjectQueue('notifications') private readonly notifQueue: Queue,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(tenantId: string, query: DocumentSearch) {
    const where: Record<string, unknown> = {
      OR: [{ senderTenantId: tenantId }, { receiverTenantId: tenantId }],
    };

    if (query.type) where['type'] = query.type;
    if (query.status) where['status'] = query.status;
    if (query.partnerId) {
      where['OR'] = [
        { senderTenantId: query.partnerId, receiverTenantId: tenantId },
        { senderTenantId: tenantId, receiverTenantId: query.partnerId },
      ];
    }
    if (query.from || query.to) {
      where['createdAt'] = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: query.sortOrder === 'asc' ? 'asc' : 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          type: true,
          status: true,
          referenceNumber: true,
          currency: true,
          totalAmount: true,
          senderTenantId: true,
          receiverTenantId: true,
          createdAt: true,
          updatedAt: true,
          // Encrypted content not returned in list
        },
      }),
    ]);

    return { data: items, meta: { total, page: query.page, limit: query.limit, hasMore: total > query.page * query.limit } };
  }

  async findById(id: string, tenantId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    if (!doc) throw new NotFoundException('Document not found');
    if (doc.senderTenantId !== tenantId && doc.receiverTenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    // Decrypt content if accessible
    let decryptedContent: string | null = null;
    if (doc.encryptedContent && doc.encryptionIv && doc.encryptionAuthTag) {
      decryptedContent = this.encryption.decrypt(
        doc.encryptedContent,
        doc.encryptionIv,
        doc.encryptionAuthTag,
      );
    }

    return { ...doc, content: decryptedContent ? JSON.parse(decryptedContent) : null };
  }

  async updateStatus(
    id: string,
    tenantId: string,
    newStatus: string,
    comment?: string,
  ) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    // Only receiver can acknowledge/accept/reject
    if (['ACKNOWLEDGED', 'ACCEPTED', 'REJECTED'].includes(newStatus)) {
      if (doc.receiverTenantId !== tenantId) {
        throw new ForbiddenException('Only the receiver can update this status');
      }
    }

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['SENT', 'CANCELLED'],
      SENT: ['ACKNOWLEDGED', 'REJECTED', 'CANCELLED'],
      ACKNOWLEDGED: ['ACCEPTED', 'REJECTED'],
      ACCEPTED: ['CANCELLED'],
    };

    if (!validTransitions[doc.status]?.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${doc.status} to ${newStatus}`);
    }

    const [updated] = await Promise.all([
      this.prisma.document.update({
        where: { id },
        data: {
          status: newStatus as never,
          ...(newStatus === 'ACKNOWLEDGED' ? { acknowledgedAt: new Date() } : {}),
          ...(newStatus === 'ACCEPTED' ? { processedAt: new Date() } : {}),
          events: {
            create: {
              type: `STATUS_${newStatus}`,
              actorTenantId: tenantId,
              comment,
            },
          },
        },
      }),
    ]);

    // Emit for webhooks
    const eventName = `${doc.type.toLowerCase()}.${newStatus.toLowerCase()}`;
    this.events.emit(eventName, { documentId: id, tenantId: doc.senderTenantId });
    this.events.emit(eventName, { documentId: id, tenantId: doc.receiverTenantId });

    await this.docQueue.add('process-status-change', { documentId: id, newStatus });

    return updated;
  }

  async getDocumentEvents(documentId: string, tenantId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.senderTenantId !== tenantId && doc.receiverTenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.documentEvent.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
