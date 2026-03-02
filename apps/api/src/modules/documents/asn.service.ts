import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentEncryptionService } from './document-encryption.service';
import type { CreateASN } from '@supplyforge/validators';

@Injectable()
export class AsnService {
  private readonly logger = new Logger(AsnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: DocumentEncryptionService,
    private readonly events: EventEmitter2,
  ) {}

  async create(senderTenantId: string, dto: CreateASN) {
    const connection = await this.prisma.partnerConnection.findFirst({
      where: {
        OR: [
          { requesterTenantId: senderTenantId, targetTenantId: dto.receiverTenantId },
          { requesterTenantId: dto.receiverTenantId, targetTenantId: senderTenantId },
        ],
        status: 'APPROVED',
      },
    });

    if (!connection) throw new ForbiddenException('No approved partner connection');

    const content = JSON.stringify({
      poReference: dto.poReference,
      shipDate: dto.shipDate,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      packages: dto.packages,
      lineItems: dto.lineItems,
      notes: dto.notes,
    });

    const { ciphertextHex, iv, authTag, contentHash } = this.encryption.encrypt(content);
    const signature = this.encryption.sign(contentHash);

    const referenceNumber = `ASN-${Date.now().toString(36).toUpperCase()}`;

    const asn = await this.prisma.document.create({
      data: {
        type: 'ASN',
        status: 'SENT',
        referenceNumber,
        senderTenantId,
        receiverTenantId: dto.receiverTenantId,
        currency: 'USD',
        encryptedContent: ciphertextHex,
        encryptionIv: iv,
        encryptionAuthTag: authTag,
        contentHash,
        digitalSignature: signature,
        sentAt: new Date(),
        metadata: {
          carrier: dto.carrier,
          trackingNumber: dto.trackingNumber,
          packageCount: dto.packages.length,
          poReference: dto.poReference,
        },
        events: {
          create: { type: 'CREATED', actorTenantId: senderTenantId },
        },
      },
    });

    // Create tracking record if tracking number provided
    if (dto.trackingNumber) {
      await this.prisma.shipment.create({
        data: {
          tenantId: dto.receiverTenantId,
          carrier: dto.carrier,
          trackingNumber: dto.trackingNumber,
          status: 'IN_TRANSIT',
          asnDocumentId: asn.id,
          origin: {},
          destination: {},
        },
      });
    }

    this.events.emit('asn.created', { documentId: asn.id, tenantId: senderTenantId });
    this.events.emit('asn.received', { documentId: asn.id, tenantId: dto.receiverTenantId });

    return asn;
  }
}
