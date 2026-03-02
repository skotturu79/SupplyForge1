import { ok, tenants, vendorProfiles } from '../../_mock/data';

export async function GET() {
  const pendingVendors = tenants
    .filter(t => t.type === 'VENDOR')
    .map(t => ({
      ...t,
      vendorProfile: vendorProfiles.find(v => v.tenantId === t.id) ?? null,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return ok({ data: pendingVendors, total: pendingVendors.length });
}
