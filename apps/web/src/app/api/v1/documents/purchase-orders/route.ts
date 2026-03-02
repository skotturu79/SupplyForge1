import { NextRequest } from 'next/server';
import { documents, BIZ_TENANT_ID } from '../../_mock/data';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const total = (body.lineItems ?? []).reduce(
    (s: number, l: { quantity: number; unitPrice: number }) => s + l.quantity * l.unitPrice, 0,
  );
  const newDoc = {
    id: `doc-${Date.now()}`,
    senderTenantId: BIZ_TENANT_ID,
    receiverTenantId: body.receiverTenantId,
    type: 'PO',
    status: 'DRAFT',
    referenceNumber: `PO-2026-${Math.floor(Math.random() * 900 + 100)}`,
    currency: body.currency ?? 'USD',
    totalAmount: total,
    dueDate: body.deliveryDate ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sentAt: null,
  };
  documents.unshift(newDoc as unknown as typeof documents[number]);
  return Response.json(newDoc, { status: 201 });
}
