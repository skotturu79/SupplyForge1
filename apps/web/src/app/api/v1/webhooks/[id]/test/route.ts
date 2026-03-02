import { NextRequest } from 'next/server';
import { ok, notFound, webhooks } from '../../../_mock/data';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const wh = webhooks.find(w => w.id === params.id);
  if (!wh) return notFound();
  // Simulate a test delivery (always succeeds in mock)
  return ok({ success: true, statusCode: 200, message: 'Test event delivered successfully' });
}
