import { NextRequest } from 'next/server';
import { ok, tenants } from '../../_mock/data';

export async function GET(req: NextRequest) {
  const q      = (req.nextUrl.searchParams.get('q') ?? '').toLowerCase();
  const status = req.nextUrl.searchParams.get('status') ?? '';
  let list = [...tenants];
  if (q)      list = list.filter(t => t.name.toLowerCase().includes(q) || t.slug.includes(q));
  if (status) list = list.filter(t => t.status === status);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok({ data: list, total: list.length });
}
