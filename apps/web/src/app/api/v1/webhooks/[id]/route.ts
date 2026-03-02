import { NextRequest } from 'next/server';
import { ok, noContent, notFound, webhooks } from '../../_mock/data';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const wh = webhooks.find(w => w.id === params.id);
  if (!wh) return notFound();
  const body = await req.json();
  Object.assign(wh, body);
  return ok(wh);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const idx = webhooks.findIndex(w => w.id === params.id);
  if (idx === -1) return notFound();
  webhooks.splice(idx, 1);
  return noContent();
}
