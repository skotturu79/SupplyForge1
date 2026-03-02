import { NextRequest } from 'next/server';
import { ok, created, feedSubscriptions, BIZ_TENANT_ID } from '../_mock/data';

export async function GET() {
  return ok({ data: feedSubscriptions.filter(f => f.subscriberTenantId === BIZ_TENANT_ID) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newSub = {
    id: `feed-${Date.now()}`,
    subscriberTenantId: BIZ_TENANT_ID,
    partnerTenantId: body.partnerTenantId,
    connectionId: body.connectionId,
    feedTypes: body.feedTypes ?? [],
    deliveryMethod: body.deliveryMethod ?? 'WEBHOOK',
    webhookUrl: body.webhookUrl ?? null,
    isActive: true,
    lastDeliveredAt: null,
    createdAt: new Date().toISOString(),
  };
  feedSubscriptions.push(newSub);
  return created(newSub);
}
