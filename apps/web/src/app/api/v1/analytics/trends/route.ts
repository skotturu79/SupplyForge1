import { ok, buildTrendData } from '../../_mock/data';

export async function GET() {
  return ok(buildTrendData());
}
