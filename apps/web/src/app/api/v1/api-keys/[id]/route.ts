import { NextRequest } from 'next/server';
import { noContent, notFound, apiKeys } from '../../_mock/data';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const idx = apiKeys.findIndex(k => k.id === params.id);
  if (idx === -1) return notFound();
  apiKeys.splice(idx, 1);
  return noContent();
}
