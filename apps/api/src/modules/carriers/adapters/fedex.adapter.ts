import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CarrierAdapter } from '../carriers.service';
import type { GenerateLabel } from '@supplyforge/validators';

@Injectable()
export class FedexAdapter implements CarrierAdapter {
  private readonly logger = new Logger(FedexAdapter.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get('FEDEX_BASE_URL', 'https://apis-sandbox.fedex.com');
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.get('FEDEX_API_KEY', ''),
        client_secret: this.config.get('FEDEX_API_SECRET', ''),
      }),
    });
    const data = await response.json() as { access_token: string };
    return data.access_token;
  }

  async generateLabel(dto: GenerateLabel) {
    const token = await this.getAccessToken();

    const body = {
      labelResponseOptions: 'URL_ONLY',
      requestedShipment: {
        shipper: { contact: {}, address: { streetLines: [dto.fromAddress.street], city: dto.fromAddress.city, stateOrProvinceCode: dto.fromAddress.state, postalCode: dto.fromAddress.zip, countryCode: dto.fromAddress.country } },
        recipients: [{ contact: {}, address: { streetLines: [dto.toAddress.street], city: dto.toAddress.city, stateOrProvinceCode: dto.toAddress.state, postalCode: dto.toAddress.zip, countryCode: dto.toAddress.country } }],
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        serviceType: dto.service,
        packagingType: 'YOUR_PACKAGING',
        requestedPackageLineItems: [{
          weight: { units: dto.weightUnit, value: dto.weight },
          ...(dto.dimensions ? { dimensions: { length: dto.dimensions.l, width: dto.dimensions.w, height: dto.dimensions.h, units: dto.dimensions.unit } } : {}),
        }],
        labelSpecification: { labelFormatType: 'COMMON2D', imageType: dto.labelFormat },
      },
      accountNumber: { value: this.config.get('FEDEX_ACCOUNT_NUMBER', '') },
    };

    const resp = await fetch(`${this.baseUrl}/ship/v1/shipments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await resp.json() as { output?: { transactionShipments?: Array<{ masterTrackingNumber: string; pieceResponses?: Array<{ packageDocuments?: Array<{ url: string; encodedLabel: string }> }> }> } };
    const shipment = data.output?.transactionShipments?.[0];

    return {
      trackingNumber: shipment?.masterTrackingNumber || '',
      labelUrl: shipment?.pieceResponses?.[0]?.packageDocuments?.[0]?.url || '',
      labelData: shipment?.pieceResponses?.[0]?.packageDocuments?.[0]?.encodedLabel || '',
    };
  }

  async trackShipment(trackingNumber: string) {
    const token = await this.getAccessToken();

    const resp = await fetch(`${this.baseUrl}/track/v1/trackingnumbers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingInfo: [{ trackingNumberInfo: { trackingNumber } }] }),
    });

    const data = await resp.json() as { output?: { completeTrackResults?: Array<{ trackResults?: Array<{ latestStatusDetail?: { description: string }; dateAndTimes?: unknown[]; scanEvents?: unknown[] }> }> } };
    const result = data.output?.completeTrackResults?.[0]?.trackResults?.[0];

    return {
      status: result?.latestStatusDetail?.description || 'UNKNOWN',
      events: result?.scanEvents || [],
    };
  }
}
