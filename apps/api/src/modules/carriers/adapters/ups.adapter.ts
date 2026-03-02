import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CarrierAdapter } from '../carriers.service';
import type { GenerateLabel } from '@supplyforge/validators';

@Injectable()
export class UpsAdapter implements CarrierAdapter {
  private readonly logger = new Logger(UpsAdapter.name);
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get('UPS_BASE_URL', 'https://wwwcie.ups.com');
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) return this.accessToken;

    const credentials = Buffer.from(
      `${this.config.get('UPS_CLIENT_ID')}:${this.config.get('UPS_CLIENT_SECRET')}`
    ).toString('base64');

    const resp = await fetch(`${this.baseUrl}/security/v1/oauth/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });

    const data = await resp.json() as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  async generateLabel(dto: GenerateLabel) {
    const token = await this.getAccessToken();

    const body = {
      ShipmentRequest: {
        Shipment: {
          Shipper: { Address: { AddressLine: [dto.fromAddress.street], City: dto.fromAddress.city, PostalCode: dto.fromAddress.zip, CountryCode: dto.fromAddress.country } },
          ShipTo: { Address: { AddressLine: [dto.toAddress.street], City: dto.toAddress.city, PostalCode: dto.toAddress.zip, CountryCode: dto.toAddress.country } },
          Service: { Code: dto.service },
          Package: { PackagingType: { Code: '02' }, PackageWeight: { UnitOfMeasurement: { Code: dto.weightUnit }, Weight: String(dto.weight) } },
        },
        LabelSpecification: { LabelImageFormat: { Code: dto.labelFormat } },
      },
    };

    const resp = await fetch(`${this.baseUrl}/api/shipments/v2403/ship`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await resp.json() as { ShipmentResponse?: { ShipmentResults?: { PackageResults?: Array<{ TrackingNumber: string; ShippingLabel?: { GraphicImage: string } }> } } };
    const pkg = data.ShipmentResponse?.ShipmentResults?.PackageResults?.[0];

    return {
      trackingNumber: pkg?.TrackingNumber || '',
      labelUrl: '',
      labelData: pkg?.ShippingLabel?.GraphicImage || '',
    };
  }

  async trackShipment(trackingNumber: string) {
    const token = await this.getAccessToken();

    const resp = await fetch(`${this.baseUrl}/api/track/v1/details/${trackingNumber}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await resp.json() as { trackResponse?: { shipment?: Array<{ currentStatus?: { description: string }; activity?: unknown[] }> } };
    const shipment = data.trackResponse?.shipment?.[0];

    return {
      status: shipment?.currentStatus?.description || 'UNKNOWN',
      events: shipment?.activity || [],
    };
  }
}
