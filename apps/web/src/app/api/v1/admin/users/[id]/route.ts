import { NextRequest } from 'next/server';
import { ok, notFound, users } from '../../../_mock/data';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const u = users.find(u => u.id === params.id);
  if (!u) return notFound();
  const body = await req.json();
  Object.assign(u, body);
  return ok(u);
}
