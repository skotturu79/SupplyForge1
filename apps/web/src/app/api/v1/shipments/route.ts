import { NextRequest } from 'next/server';
import { ok, shipments } from '../_mock/data';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status   = searchParams.get('status');
  const tracking = searchParams.get('trackingNumber');
  const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
  const limit    = Math.max(1, parseInt(searchParams.get('limit') ?? '20'));

  let list = [...shipments];
  if (status)   list = list.filter(s => s.status === status);
  if (tracking) list = list.filter(s => s.trackingNumber.includes(tracking));
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total   = list.length;
  const offset  = (page - 1) * limit;
  const data    = list.slice(offset, offset + limit);
  const hasMore = offset + data.length < total;

  return ok({ data, meta: { total, page, limit, hasMore } });
}
