import { NextRequest } from 'next/server';
import { ok, notFound, partnerConnections } from '../../../_mock/data';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const conn = partnerConnections.find(c => c.id === params.id);
  if (!conn) return notFound();
  conn.status = 'APPROVED';
  conn.approvedAt = new Date().toISOString();
  return ok(conn);
}
