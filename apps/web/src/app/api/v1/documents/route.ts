import { NextRequest } from 'next/server';
import { ok, documents, BIZ_TENANT_ID } from '../_mock/data';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit  = parseInt(searchParams.get('limit') ?? '20');
  const page   = parseInt(searchParams.get('page')  ?? '1');
  const type   = searchParams.get('type');
  const status = searchParams.get('status');

  let filtered = [...documents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  if (type)   filtered = filtered.filter(d => d.type === type);
  if (status) filtered = filtered.filter(d => d.status === status);

  const total   = filtered.length;
  const offset  = (page - 1) * limit;
  const data    = filtered.slice(offset, offset + limit);
  const hasMore = offset + data.length < total;

  return ok({ data, meta: { total, page, limit, hasMore } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newDoc = {
    id: `doc-${Date.now()}`,
    senderTenantId: BIZ_TENANT_ID,
    receiverTenantId: body.receiverTenantId ?? 'tenant-v-001',
    type: body.type ?? 'PO',
    status: 'DRAFT',
    referenceNumber: body.referenceNumber ?? `PO-2026-${Math.floor(Math.random() * 900 + 100)}`,
    currency: body.currency ?? 'USD',
    totalAmount: body.lineItems?.reduce((s: number, l: { quantity: number; unitPrice: number }) => s + l.quantity * l.unitPrice, 0) ?? 0,
    dueDate: body.deliveryDate ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sentAt: null,
  };
  documents.unshift(newDoc);
  return Response.json(newDoc, { status: 201 });
}
