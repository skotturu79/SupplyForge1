import { NextRequest } from 'next/server';
import { shippingLabels, ok, created, VENDOR1_TENANT_ID } from '../../../_mock/data';

type Params = { params: { carrier: string } };

function generateTrackingNumber(carrier: string): string {
  const rand = (n: number) => Math.floor(Math.random() * n);
  switch (carrier.toUpperCase()) {
    case 'FEDEX': return Array.from({ length: 12 }, () => rand(10)).join('');
    case 'UPS': {
      const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const mid   = Array.from({ length: 8 }, () => alpha[rand(alpha.length)]).join('');
      return `1Z${mid}${Array.from({ length: 8 }, () => rand(10)).join('')}`;
    }
    case 'DHL':  return Array.from({ length: 10 }, () => rand(10)).join('');
    default:     return Array.from({ length: 20 }, () => rand(10)).join('');
  }
}

function generateSscc(): string {
  return `00${Math.floor(Math.random() * 1e16).toString().padStart(16, '0')}`;
}

function generateHuNumber(): string {
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 8);
  return `HU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000 + 1000))}-${suffix}`;
}

const CARRIER_SERVICES: Record<string, string[]> = {
  FEDEX: ['FEDEX_INTERNATIONAL_PRIORITY', 'FEDEX_INTERNATIONAL_ECONOMY', 'FEDEX_GROUND'],
  UPS:   ['UPS_WORLDWIDE_EXPRESS', 'UPS_WORLDWIDE_EXPEDITED', 'UPS_STANDARD'],
  DHL:   ['DHL_EXPRESS_WORLDWIDE', 'DHL_EXPRESS_12', 'DHL_ECONOMY_SELECT'],
  USPS:  ['PRIORITY_MAIL_INTERNATIONAL', 'FIRST_CLASS_PACKAGE_INTERNATIONAL', 'PRIORITY_MAIL'],
};

export async function POST(req: NextRequest, { params }: Params) {
  const rawCarrier = params.carrier.toUpperCase();
  const body       = await req.json();
  const labelType  = (body.type ?? 'SHIPPING') as string;

  const id  = `lbl-${Date.now()}`;
  const now = new Date().toISOString();

  // ── Base fields shared by all label types ───────────────────────
  const base = {
    id,
    type:       labelType,
    tenantId:   body.tenantId ?? VENDOR1_TENANT_ID,
    carrier:    rawCarrier === 'NONE' ? 'NONE' : rawCarrier,
    labelFormat: body.labelFormat ?? 'PDF',
    fromAddress: body.fromAddress ?? {},
    toAddress:   body.toAddress   ?? {},
    referenceNumber: body.referenceNumber ?? null,
    batchNumber:     body.batchNumber     ?? null,
    lotNumber:       body.lotNumber       ?? null,
    orderId:         body.orderId         ?? null,
    rateCharged:     null as number | null,
    createdAt:       now,
  };

  // ── Type-specific fields ─────────────────────────────────────────
  let specific: Record<string, unknown> = {};

  if (labelType === 'SHIPPING') {
    const trackingNumber = generateTrackingNumber(rawCarrier);
    specific = {
      service:           body.service ?? (CARRIER_SERVICES[rawCarrier]?.[0] ?? 'STANDARD'),
      trackingNumber,
      sscc:              generateSscc(),
      shipDate:          now,
      estimatedDelivery: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      weight:            body.weight      ?? 1,
      weightUnit:        body.weightUnit  ?? 'LB',
      dimensions:        body.dimensions  ?? null,
      isReturn:          body.isReturn          ?? false,
      signatureRequired: body.signatureRequired ?? false,
      rateCharged:       parseFloat((Math.random() * 100 + 20).toFixed(2)),
      labelUrl:          `/api/v1/carriers/${rawCarrier}/labels/${id}/download`,
    };
  } else if (labelType === 'PALLET') {
    specific = {
      sscc:            generateSscc(),
      content:         body.content        ?? '',
      grossWeight:     body.grossWeight    ?? 0,
      grossWeightUnit: body.grossWeightUnit ?? 'KG',
      units:           body.units          ?? 0,
      unitsType:       body.unitsType      ?? 'CTN',
      productionDate:  body.productionDate ?? null,
      expiryDate:      body.expiryDate     ?? null,
      service:         null,
      trackingNumber:  null,
      shipDate:        now,
      estimatedDelivery: null,
    };
  } else if (labelType === 'HU') {
    specific = {
      huNumber:            body.huNumber            ?? generateHuNumber(),
      materialNumber:      body.materialNumber       ?? '',
      materialDescription: body.materialDescription ?? '',
      quantity:            body.quantity            ?? 0,
      quantityUnit:        body.quantityUnit        ?? 'PC',
      deliveryNumber:      body.deliveryNumber      ?? null,
      plant:               body.plant               ?? null,
      storageLocation:     body.storageLocation     ?? null,
      service:             null,
      trackingNumber:      null,
      sscc:                null,
      shipDate:            now,
      estimatedDelivery:   null,
    };
  } else {
    // BOX
    specific = {
      contents:     body.contents     ?? '',
      cartonNumber: body.cartonNumber ?? 1,
      totalCartons: body.totalCartons ?? 1,
      qtyPerCarton: body.qtyPerCarton ?? 0,
      qtyUnit:      body.qtyUnit      ?? 'PC',
      weight:       body.weight       ?? 0,
      weightUnit:   body.weightUnit   ?? 'KG',
      service:      null,
      trackingNumber: null,
      sscc:           null,
      shipDate:       now,
      estimatedDelivery: null,
    };
  }

  const label = { ...base, ...specific };
  shippingLabels.unshift(label as typeof shippingLabels[number]);
  return created(label);
}

export async function GET(_req: NextRequest, { params }: Params) {
  const carrier = params.carrier.toUpperCase();
  const results = [...shippingLabels]
    .filter(l => l.carrier === carrier)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok({ data: results, meta: { total: results.length } });
}
