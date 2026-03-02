import { ok, created, vendorCatalog, VENDOR1_TENANT_ID } from '../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status');
  const category = searchParams.get('category');
  const q        = searchParams.get('q')?.toLowerCase();

  let items = vendorCatalog.filter((p) => p.tenantId === TENANT_ID);
  if (status)   items = items.filter((p) => p.status === status);
  if (category) items = items.filter((p) => p.category === category);
  if (q)        items = items.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));

  const categories = [...new Set(vendorCatalog.filter((p) => p.tenantId === TENANT_ID).map((p) => p.category))];
  return ok({ data: items, total: items.length, categories });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const now  = new Date().toISOString();
  const item = {
    id:          `cat-${Date.now()}`,
    tenantId:    TENANT_ID,
    sku:         body.sku         ?? '',
    name:        body.name        ?? '',
    description: body.description ?? '',
    category:    body.category    ?? '',
    unitPrice:   Number(body.unitPrice)   || 0,
    currency:    body.currency    ?? 'USD',
    moq:         Number(body.moq)         || 1,
    leadTimeDays:Number(body.leadTimeDays)|| 7,
    stock:       Number(body.stock)       || 0,
    unit:        body.unit        ?? 'PCS',
    status:      body.status      ?? 'ACTIVE',
    images:      [],
    tags:        body.tags        ?? [],
    createdAt:   now,
    updatedAt:   now,
  } as typeof vendorCatalog[0];
  vendorCatalog.push(item);
  return created(item);
}
