import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Processor('tracking-poll')
export class TrackingPollerProcessor {
  private readonly logger = new Logger(TrackingPollerProcessor.name);

  constructor(private readonly tracking: TrackingService) {}

  @Process('poll')
  async poll(job: Job<{ shipmentId: string; tenantId: string }>) {
    const { shipmentId, tenantId } = job.data;
    try {
      await this.tracking.refreshTracking(shipmentId, tenantId);
    } catch (err) {
      this.logger.warn(`Tracking poll failed for ${shipmentId}: ${(err as Error).message}`);
    }
  }
}
