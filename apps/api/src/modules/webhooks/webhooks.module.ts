import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookDeliveryProcessor } from './webhook-delivery.processor';
import { WebhookEventListener } from './webhook-event.listener';

@Module({
  imports: [BullModule.registerQueue({ name: 'webhook-delivery' })],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookDeliveryProcessor, WebhookEventListener],
  exports: [WebhooksService],
})
export class WebhooksModule {}
