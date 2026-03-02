import { NextRequest } from 'next/server';
import { noContent } from '../../../_mock/data';

export async function DELETE(_req: NextRequest, { params: _ }: { params: { id: string } }) {
  // In mock: just return 204 — session "revoked"
  return noContent();
}
