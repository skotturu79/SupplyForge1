import { ok, notFound, vendorQuotes, VENDOR1_TENANT_ID } from '../../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const idx = vendorQuotes.findIndex((q) => q.id === params.id && q.tenantId === TENANT_ID);
  if (idx === -1) return notFound();
  const body = await req.json().catch(() => ({}));
  const now  = new Date().toISOString();
  const update: Partial<typeof vendorQuotes[0]> = { ...body, updatedAt: now };
  if (body.status === 'SUBMITTED' && !vendorQuotes[idx].submittedAt) {
    update.submittedAt = now;
  }
  vendorQuotes[idx] = { ...vendorQuotes[idx], ...update };
  return ok(vendorQuotes[idx]);
}
