import { NextRequest } from 'next/server';
import { ok, tenants, BIZ_TENANT_ID } from '../../_mock/data';

export async function GET() {
  return ok(tenants.find(t => t.id === BIZ_TENANT_ID));
}

export async function PATCH(req: NextRequest) {
  const t = tenants.find(t => t.id === BIZ_TENANT_ID)!;
  const body = await req.json();
  Object.assign(t, body);
  return ok(t);
}
