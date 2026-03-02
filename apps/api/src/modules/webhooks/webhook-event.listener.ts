import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhooksService } from './webhooks.service';

@Injectable()
export class WebhookEventListener {
  constructor(private readonly webhooks: WebhooksService) {}

  @OnEvent('po.*')
  async onPoEvent(payload: { documentId: string; tenantId: string }, event: string) {
    await this.webhooks.dispatchEvent(payload.tenantId, event, payload);
  }

  @OnEvent('invoice.*')
  async onInvoiceEvent(payload: { documentId: string; tenantId: string }, event: string) {
    await this.webhooks.dispatchEvent(payload.tenantId, event, payload);
  }

  @OnEvent('asn.*')
  async onAsnEvent(payload: { documentId: string; tenantId: string }, event: string) {
    await this.webhooks.dispatchEvent(payload.tenantId, event, payload);
  }

  @OnEvent('tracking.*')
  async onTrackingEvent(payload: { shipmentId: string; tenantId: string }, event: string) {
    await this.webhooks.dispatchEvent(payload.tenantId, event, payload);
  }

  @OnEvent('partner.*')
  async onPartnerEvent(payload: { connectionId: string; requesterTenantId: string; targetTenantId: string }, event: string) {
    await this.webhooks.dispatchEvent(payload.requesterTenantId, event, payload);
    await this.webhooks.dispatchEvent(payload.targetTenantId, event, payload);
  }
}
