import { ok, noContent, notFound, vendorCatalog, VENDOR1_TENANT_ID } from '../../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = vendorCatalog.find((p) => p.id === params.id && p.tenantId === TENANT_ID);
  return item ? ok(item) : notFound();
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const idx = vendorCatalog.findIndex((p) => p.id === params.id && p.tenantId === TENANT_ID);
  if (idx === -1) return notFound();
  const body = await req.json().catch(() => ({}));
  vendorCatalog[idx] = { ...vendorCatalog[idx], ...body, updatedAt: new Date().toISOString() };
  return ok(vendorCatalog[idx]);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const idx = vendorCatalog.findIndex((p) => p.id === params.id && p.tenantId === TENANT_ID);
  if (idx === -1) return notFound();
  vendorCatalog.splice(idx, 1);
  return noContent();
}
