import { ok, created, vendorReturns, VENDOR1_TENANT_ID } from '../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  let items = vendorReturns.filter((r) => r.tenantId === TENANT_ID);
  if (status) items = items.filter((r) => r.status === status);
  return ok({ data: items, total: items.length });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const now  = new Date().toISOString();
  const seq  = vendorReturns.length + 1;
  const item = {
    id:                 `rma-${Date.now()}`,
    rmaNumber:          `RMA-${new Date().getFullYear()}-${String(seq + 20).padStart(4, '0')}`,
    tenantId:           TENANT_ID,
    buyerTenantId:      body.buyerTenantId      ?? '',
    poReference:        body.poReference        ?? '',
    invoiceReference:   body.invoiceReference   ?? '',
    reason:             body.reason             ?? 'OTHER',
    status:             'REQUESTED' as const,
    items:              body.items              ?? [],
    creditNoteNumber:   null,
    creditNoteAmount:   null,
    notes:              body.notes              ?? '',
    requestedAt:        now,
    updatedAt:          now,
    closedAt:           null,
  } as typeof vendorReturns[0];
  vendorReturns.push(item);
  return created(item);
}
