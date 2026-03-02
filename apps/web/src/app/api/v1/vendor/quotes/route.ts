import { ok, created, vendorQuotes, VENDOR1_TENANT_ID } from '../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  let items = vendorQuotes.filter((q) => q.tenantId === TENANT_ID);
  if (status) items = items.filter((q) => q.status === status);
  return ok({ data: items, total: items.length });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const now  = new Date().toISOString();
  const seq  = vendorQuotes.length + 1;
  const item = {
    id:             `qt-${Date.now()}`,
    quoteNumber:    `Q-${new Date().getFullYear()}-${String(seq + 30).padStart(4, '0')}`,
    tenantId:       TENANT_ID,
    buyerTenantId:  body.buyerTenantId  ?? '',
    rfqReference:   body.rfqReference   ?? '',
    subject:        body.subject        ?? '',
    status:         'DRAFT'             as const,
    items:          body.items          ?? [],
    validUntil:     body.validUntil     ?? null,
    deliveryTerms:  body.deliveryTerms  ?? '',
    paymentTerms:   body.paymentTerms   ?? '',
    notes:          body.notes          ?? '',
    receivedAt:     now,
    submittedAt:    null,
    updatedAt:      now,
  } as typeof vendorQuotes[0];
  vendorQuotes.push(item);
  return created(item);
}
