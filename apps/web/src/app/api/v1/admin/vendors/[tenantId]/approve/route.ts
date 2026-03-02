import { NextRequest } from 'next/server';
import { ok, notFound, tenants, vendorProfiles } from '../../../../_mock/data';

export async function POST(_req: NextRequest, { params }: { params: { tenantId: string } }) {
  const t = tenants.find(t => t.id === params.tenantId);
  if (!t) return notFound();
  t.status = 'VERIFIED';
  const profile = vendorProfiles.find(v => v.tenantId === params.tenantId);
  if (profile) profile.verificationStatus = 'VERIFIED';
  return ok({ message: 'Vendor approved', tenant: t });
}
