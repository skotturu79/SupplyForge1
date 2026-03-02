import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentEncryptionService } from './document-encryption.service';
import { generateSSCC } from '@supplyforge/crypto';
import type { CreatePO } from '@supplyforge/validators';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: DocumentEncryptionService,
    private readonly events: EventEmitter2,
  ) {}

  async create(senderTenantId: string, dto: CreatePO) {
    // Verify partner connection exists and is approved
    const connection = await this.prisma.partnerConnection.findFirst({
      where: {
        OR: [
          { requesterTenantId: senderTenantId, targetTenantId: dto.receiverTenantId },
          { requesterTenantId: dto.receiverTenantId, targetTenantId: senderTenantId },
        ],
        status: 'APPROVED',
      },
    });

    if (!connection) {
      throw new ForbiddenException('No approved partner connection with this tenant');
    }

    // Verify PO is in allowed doc types
    if (!(connection.dataSharingConfig as any)?.allowedDocTypes?.includes('PO')) {
      throw new ForbiddenException('Partner connection does not allow PO exchange');
    }

    // Build content JSON
    const content = JSON.stringify({
      deliveryAddress: dto.deliveryAddress,
      deliveryDate: dto.deliveryDate,
      paymentTerms: dto.paymentTerms,
      incoterms: dto.incoterms,
      lineItems: dto.lineItems,
      notes: dto.notes,
      externalRef: dto.externalRef,
    });

    // Encrypt content
    const { ciphertextHex, iv, authTag, contentHash } = this.encryption.encrypt(content);
    const signature = this.encryption.sign(contentHash);

    const totalAmount = dto.lineItems.reduce((s, i) => s + i.totalPrice, 0);
    const referenceNumber = `PO-${Date.now().toString(36).toUpperCase()}`;

    const po = await this.prisma.document.create({
      data: {
        type: 'PO',
        status: 'DRAFT',
        referenceNumber,
        senderTenantId,
        receiverTenantId: dto.receiverTenantId,
        currency: dto.currency || 'USD',
        totalAmount,
        externalRef: dto.externalRef,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        encryptedContent: ciphertextHex,
        encryptionIv: iv,
        encryptionAuthTag: authTag,
        contentHash,
        digitalSignature: signature,
        metadata: { lineItemCount: dto.lineItems.length },
        events: {
          create: { type: 'CREATED', actorTenantId: senderTenantId },
        },
      },
    });

    this.logger.log(`PO ${po.id} created by ${senderTenantId}`);
    this.events.emit('po.created', { documentId: po.id, tenantId: senderTenantId });

    return po;
  }

  async send(id: string, tenantId: string) {
    const po = await this.prisma.document.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.senderTenantId !== tenantId) throw new ForbiddenException('Not your document');
    if (po.status !== 'DRAFT') throw new ForbiddenException('Only DRAFT POs can be sent');

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        events: { create: { type: 'SENT', actorTenantId: tenantId } },
      },
    });

    this.events.emit('po.sent', { documentId: id, tenantId: po.receiverTenantId });
    return updated;
  }

  async generateSSCCForPO(poId: string, tenantId: string, gs1Prefix: string) {
    const po = await this.prisma.document.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('PO not found');
    if (po.senderTenantId !== tenantId && po.receiverTenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const sscc = generateSSCC(gs1Prefix);
    return { sscc, poId };
  }
}
