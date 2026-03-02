import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FedexAdapter } from './adapters/fedex.adapter';
import { UpsAdapter } from './adapters/ups.adapter';
import type { GenerateLabel } from '@supplyforge/validators';

export interface CarrierAdapter {
  generateLabel(dto: GenerateLabel): Promise<{ trackingNumber: string; labelUrl: string; labelData: string }>;
  trackShipment(trackingNumber: string): Promise<{ status: string; events: unknown[] }>;
}

@Injectable()
export class CarrierService {
  constructor(
    private readonly fedex: FedexAdapter,
    private readonly ups: UpsAdapter,
    private readonly config: ConfigService,
  ) {}

  private getAdapter(carrier: string): CarrierAdapter {
    switch (carrier.toUpperCase()) {
      case 'FEDEX': return this.fedex;
      case 'UPS': return this.ups;
      default: throw new BadRequestException(`Carrier ${carrier} not supported`);
    }
  }

  async generateLabel(carrier: string, dto: GenerateLabel) {
    return this.getAdapter(carrier).generateLabel(dto);
  }

  async trackShipment(carrier: string, trackingNumber: string) {
    return this.getAdapter(carrier).trackShipment(trackingNumber);
  }
}
