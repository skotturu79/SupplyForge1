import { ok, vendorPayments, VENDOR1_TENANT_ID } from '../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  let items = vendorPayments.filter((p) => p.tenantId === TENANT_ID);
  if (status) items = items.filter((p) => p.status === status);

  const totalPaid      = items.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const totalScheduled = items.filter((p) => p.status === 'SCHEDULED').reduce((s, p) => s + p.amount, 0);
  const totalProcessing= items.filter((p) => p.status === 'PROCESSING').reduce((s, p) => s + p.amount, 0);

  return ok({ data: items, total: items.length, summary: { totalPaid, totalScheduled, totalProcessing } });
}
