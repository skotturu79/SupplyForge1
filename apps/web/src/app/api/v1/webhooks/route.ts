import { NextRequest } from 'next/server';
import { ok, created, webhooks, BIZ_TENANT_ID } from '../_mock/data';

export async function GET() {
  return ok({ data: webhooks.filter(w => w.tenantId === BIZ_TENANT_ID) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newWh = {
    id: `wh-${Date.now()}`,
    tenantId: BIZ_TENANT_ID,
    name: body.name,
    url: body.url,
    events: body.events ?? [],
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  webhooks.push(newWh);
  return created(newWh);
}
