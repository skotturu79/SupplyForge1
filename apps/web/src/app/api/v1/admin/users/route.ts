import { NextRequest } from 'next/server';
import { ok, users } from '../../_mock/data';

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').toLowerCase();
  let list = [...users];
  if (q) list = list.filter(u =>
    u.email.toLowerCase().includes(q) ||
    u.firstName.toLowerCase().includes(q) ||
    u.lastName.toLowerCase().includes(q),
  );
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok({ data: list, total: list.length });
}
