import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface DeliveryJob {
  webhookId: string;
  url: string;
  payload: string;
  signature: string;
}

@Processor('webhook-delivery')
export class WebhookDeliveryProcessor {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('deliver')
  async deliver(job: Job<DeliveryJob>) {
    const { webhookId, url, payload, signature } = job.data;
    const timeout = parseInt(process.env.WEBHOOK_TIMEOUT_MS || '10000');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SupplyForge-Signature': signature,
          'X-SupplyForge-Delivery': job.id as string,
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timer);

      await this.prisma.webhookDelivery.create({
        data: {
          webhookId,
          statusCode: response.status,
          success: response.ok,
          attempt: job.attemptsMade + 1,
          payload,
        },
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      this.logger.log(`Webhook ${webhookId} delivered successfully (${response.status})`);
    } catch (err) {
      clearTimeout(timer);
      this.logger.warn(`Webhook ${webhookId} delivery failed: ${(err as Error).message}`);
      throw err; // Bull will retry
    }
  }
}
