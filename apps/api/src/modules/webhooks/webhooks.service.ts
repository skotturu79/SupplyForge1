import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { signWebhookPayload, generateWebhookSecret } from '@supplyforge/crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('webhook-delivery') private readonly queue: Queue,
  ) {}

  async createWebhook(tenantId: string, dto: { name: string; url: string; events: string[]; isActive?: boolean }) {
    const secret = generateWebhookSecret();
    return this.prisma.webhook.create({
      data: {
        tenantId,
        name: dto.name,
        url: dto.url,
        events: dto.events,
        isActive: dto.isActive ?? true,
        secret,
      },
      // Return secret ONCE on creation
    });
  }

  async listWebhooks(tenantId: string) {
    return this.prisma.webhook.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        // Never return secret in list
      },
    });
  }

  async deleteWebhook(id: string, tenantId: string) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook || webhook.tenantId !== tenantId) throw new NotFoundException('Webhook not found');
    await this.prisma.webhook.delete({ where: { id } });
  }

  /**
   * Dispatch an event to all matching webhooks for a tenant.
   */
  async dispatchEvent(tenantId: string, event: string, data: Record<string, unknown>) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: event },
      },
    });

    for (const webhook of webhooks) {
      const payload = JSON.stringify({
        id: crypto.randomUUID(),
        event,
        tenantId,
        timestamp: new Date().toISOString(),
        data,
      });

      const signature = signWebhookPayload(payload, webhook.secret);

      await this.queue.add(
        'deliver',
        { webhookId: webhook.id, url: webhook.url, payload, signature },
        {
          attempts: parseInt(process.env.WEBHOOK_MAX_RETRIES || '5'),
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      );
    }
  }
}
