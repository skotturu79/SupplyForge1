import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PurchaseOrdersService } from './purchase-orders.service';
import { InvoicesService } from './invoices.service';
import { AsnService } from './asn.service';
import { DocumentEncryptionService } from './document-encryption.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'document-events' },
      { name: 'notifications' },
    ),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    PurchaseOrdersService,
    InvoicesService,
    AsnService,
    DocumentEncryptionService,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
