import { NextRequest } from 'next/server';
import { ok, notFound, tenants } from '../../../_mock/data';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const t = tenants.find(t => t.id === params.id);
  if (!t) return notFound();
  const body = await req.json();
  Object.assign(t, body);
  return ok(t);
}
