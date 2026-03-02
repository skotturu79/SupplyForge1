import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentEncryptionService } from './document-encryption.service';
import type { CreateInvoice } from '@supplyforge/validators';

export type ThreeWayMatchResult = {
  status: 'MATCHED' | 'PARTIAL' | 'DISCREPANCY' | 'PENDING';
  details: Record<string, unknown>;
};

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: DocumentEncryptionService,
    private readonly events: EventEmitter2,
  ) {}

  async create(senderTenantId: string, dto: CreateInvoice) {
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
      invoiceDate: dto.invoiceDate,
      dueDate: dto.dueDate,
      paymentTerms: dto.paymentTerms,
      poReference: dto.poReference,
      lineItems: dto.lineItems,
      taxAmount: dto.taxAmount,
      bankDetails: dto.bankDetails,
      notes: dto.notes,
    });

    const { ciphertextHex, iv, authTag, contentHash } = this.encryption.encrypt(content);
    const signature = this.encryption.sign(contentHash);

    const totalAmount = dto.lineItems.reduce((s, i) => s + i.totalPrice, 0) + (dto.taxAmount || 0);
    const referenceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const invoice = await this.prisma.document.create({
      data: {
        type: 'INVOICE',
        status: 'SENT',
        referenceNumber,
        senderTenantId,
        receiverTenantId: dto.receiverTenantId,
        currency: dto.currency || 'USD',
        totalAmount,
        encryptedContent: ciphertextHex,
        encryptionIv: iv,
        encryptionAuthTag: authTag,
        contentHash,
        digitalSignature: signature,
        dueDate: new Date(dto.dueDate),
        sentAt: new Date(),
        metadata: { poReference: dto.poReference },
        events: {
          create: { type: 'CREATED', actorTenantId: senderTenantId },
        },
      },
    });

    this.events.emit('invoice.received', { documentId: invoice.id, tenantId: dto.receiverTenantId });

    // Attempt auto 3-way match if PO reference provided
    if (dto.poReference) {
      await this.attemptThreeWayMatch(invoice.id, dto.poReference, dto.receiverTenantId);
    }

    return invoice;
  }

  async attemptThreeWayMatch(invoiceId: string, poReference: string, buyerTenantId: string): Promise<ThreeWayMatchResult> {
    // Find PO by reference number
    const po = await this.prisma.document.findFirst({
      where: {
        referenceNumber: poReference,
        receiverTenantId: buyerTenantId,
        type: 'PO',
      },
    });

    if (!po) {
      return { status: 'PENDING', details: { reason: 'PO not found' } };
    }

    const invoice = await this.prisma.document.findUnique({ where: { id: invoiceId } });
    if (!invoice) return { status: 'PENDING', details: {} };

    // Decrypt both documents for comparison
    let poContent: Record<string, unknown> | null = null;
    let invContent: Record<string, unknown> | null = null;

    if (po.encryptedContent && po.encryptionIv && po.encryptionAuthTag) {
      poContent = JSON.parse(this.encryption.decrypt(po.encryptedContent, po.encryptionIv, po.encryptionAuthTag));
    }
    if (invoice.encryptedContent && invoice.encryptionIv && invoice.encryptionAuthTag) {
      invContent = JSON.parse(this.encryption.decrypt(invoice.encryptedContent, invoice.encryptionIv, invoice.encryptionAuthTag));
    }

    if (!poContent || !invContent) {
      return { status: 'PENDING', details: { reason: 'Cannot decrypt documents' } };
    }

    // Simple amount comparison (production would do line-item level matching)
    const poTotal = po.totalAmount || 0;
    const invTotal = invoice.totalAmount || 0;
    const tolerance = 0.01; // 1 cent tolerance

    const amountMatch = Math.abs(poTotal - invTotal) <= tolerance;
    const currencyMatch = po.currency === invoice.currency;

    let matchStatus: 'MATCHED' | 'PARTIAL' | 'DISCREPANCY';
    if (amountMatch && currencyMatch) {
      matchStatus = 'MATCHED';
    } else if (currencyMatch && Math.abs(poTotal - invTotal) / poTotal < 0.05) {
      matchStatus = 'PARTIAL'; // within 5%
    } else {
      matchStatus = 'DISCREPANCY';
    }

    await this.prisma.document.update({
      where: { id: invoiceId },
      data: {
        metadata: {
          ...(invoice.metadata as Record<string, unknown>),
          threeWayMatchStatus: matchStatus,
          matchedPoId: po.id,
        },
      },
    });

    if (matchStatus === 'MATCHED') {
      this.events.emit('invoice.matched', { documentId: invoiceId, tenantId: buyerTenantId });
    } else if (matchStatus === 'DISCREPANCY') {
      this.events.emit('invoice.disputed', { documentId: invoiceId, tenantId: buyerTenantId });
    }

    this.logger.log(`3-way match for invoice ${invoiceId}: ${matchStatus}`);

    return {
      status: matchStatus,
      details: { poTotal, invTotal, currency: po.currency, poId: po.id },
    };
  }
}
