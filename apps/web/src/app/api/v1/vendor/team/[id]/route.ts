import { ok, noContent, notFound, vendorTeam, VENDOR1_TENANT_ID } from '../../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const idx = vendorTeam.findIndex((m) => m.id === params.id && m.tenantId === TENANT_ID);
  if (idx === -1) return notFound();
  const body = await req.json().catch(() => ({}));
  vendorTeam[idx] = { ...vendorTeam[idx], ...body };
  return ok(vendorTeam[idx]);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const idx = vendorTeam.findIndex((m) => m.id === params.id && m.tenantId === TENANT_ID);
  if (idx === -1) return notFound();
  vendorTeam.splice(idx, 1);
  return noContent();
}
