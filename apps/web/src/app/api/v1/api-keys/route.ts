import { NextRequest } from 'next/server';
import { ok, created, apiKeys, BIZ_TENANT_ID } from '../_mock/data';

export async function GET() {
  return ok({ data: apiKeys.filter(k => k.tenantId === BIZ_TENANT_ID) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rawKey = `sf_live_${crypto.randomUUID().replace(/-/g, '')}`;
  const newKey = {
    id: `key-${Date.now()}`,
    tenantId: BIZ_TENANT_ID,
    name: body.name,
    keyPrefix: rawKey.slice(0, 12),
    scopes: body.scopes ?? [],
    isActive: true,
    callCount: 0,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    expiresAt: body.expiresAt ?? null,
    // Return the full key ONCE — never returned again
    key: rawKey,
  };
  apiKeys.push(newKey as unknown as typeof apiKeys[number]);
  return created(newKey);
}
