import { ok, users, BIZ_TENANT_ID } from '../_mock/data';

export async function GET() {
  return ok({ data: users.filter(u => u.tenantId === BIZ_TENANT_ID) });
}
