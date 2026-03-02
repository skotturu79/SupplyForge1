import { NextRequest } from 'next/server';
import { documents, lineAcknowledgements, ok, notFound } from '../../../_mock/data';

const ACTION_STATUS: Record<string, string> = {
  acknowledge: 'ACKNOWLEDGED',
  accept:      'ACCEPTED',
  reject:      'REJECTED',
  cancel:      'CANCELLED',
  pay:         'PAID',
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; action: string } },
) {
  const doc = documents.find(d => d.id === params.id);
  if (!doc) return notFound();

  const newStatus = ACTION_STATUS[params.action];
  if (!newStatus) return notFound('Unknown action');

  doc.status = newStatus;
  (doc as Record<string, unknown>).updatedAt = new Date().toISOString();

  if (params.action === 'acknowledge') {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body.lineAcknowledgements)) {
      lineAcknowledgements[params.id] = body.lineAcknowledgements;
    }
  }

  return ok(doc);
}
