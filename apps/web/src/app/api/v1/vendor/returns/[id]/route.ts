import { ok, notFound, vendorReturns, VENDOR1_TENANT_ID } from '../../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const idx = vendorReturns.findIndex((r) => r.id === params.id && r.tenantId === TENANT_ID);
  if (idx === -1) return notFound();
  const body = await req.json().catch(() => ({}));
  vendorReturns[idx] = { ...vendorReturns[idx], ...body, updatedAt: new Date().toISOString() };
  return ok(vendorReturns[idx]);
}
