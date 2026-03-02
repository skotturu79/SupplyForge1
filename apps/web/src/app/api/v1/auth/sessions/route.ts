import { ok, authSessions } from '../../_mock/data';

export async function GET() {
  return ok({ data: authSessions });
}
