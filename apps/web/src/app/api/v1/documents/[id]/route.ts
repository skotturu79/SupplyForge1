import { NextRequest } from 'next/server';
import { documents, tenants, documentLineItems, lineAcknowledgements, ok, notFound } from '../../_mock/data';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const doc = documents.find(d => d.id === params.id);
  if (!doc) return notFound();

  const sender   = tenants.find(t => t.id === doc.senderTenantId);
  const receiver = tenants.find(t => t.id === doc.receiverTenantId);

  return ok({
    ...doc,
    sender:   sender   ? { id: sender.id,   name: sender.name,   country: sender.country }   : null,
    receiver: receiver ? { id: receiver.id, name: receiver.name, country: receiver.country } : null,
    lineItems:            documentLineItems[params.id]    ?? [],
    lineAcknowledgements: lineAcknowledgements[params.id] ?? [],
  });
}
