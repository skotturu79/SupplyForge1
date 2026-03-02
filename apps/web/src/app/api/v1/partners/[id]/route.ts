import { NextRequest } from 'next/server';
import { ok, noContent, notFound, partnerConnections } from '../../_mock/data';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const conn = partnerConnections.find(c => c.id === params.id);
  return conn ? ok(conn) : notFound();
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const idx = partnerConnections.findIndex(c => c.id === params.id);
  if (idx === -1) return notFound();
  partnerConnections.splice(idx, 1);
  return noContent();
}
