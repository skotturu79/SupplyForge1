import { NextRequest } from 'next/server';
import { shippingLabels, ok } from '../../_mock/data';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tenantId = searchParams.get('tenantId');
  const carrier  = searchParams.get('carrier');
  const limit    = parseInt(searchParams.get('limit') ?? '20');
  const page     = parseInt(searchParams.get('page')  ?? '1');

  let filtered = [...shippingLabels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  if (tenantId) filtered = filtered.filter(l => l.tenantId === tenantId);
  if (carrier)  filtered = filtered.filter(l => l.carrier  === carrier.toUpperCase());

  const total   = filtered.length;
  const offset  = (page - 1) * limit;
  const data    = filtered.slice(offset, offset + limit);
  const hasMore = offset + data.length < total;

  return ok({ data, meta: { total, page, limit, hasMore } });
}
