import { ok, noContent, notFound, vendorVault, VENDOR1_TENANT_ID } from '../../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const idx = vendorVault.findIndex((v) => v.id === params.id && v.tenantId === TENANT_ID);
  if (idx === -1) return notFound();
  vendorVault.splice(idx, 1);
  return noContent();
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const idx = vendorVault.findIndex((v) => v.id === params.id && v.tenantId === TENANT_ID);
  if (idx === -1) return notFound();
  const body = await req.json().catch(() => ({}));
  vendorVault[idx] = { ...vendorVault[idx], ...body };
  return ok(vendorVault[idx]);
}
