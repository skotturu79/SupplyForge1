import { NextRequest } from 'next/server';
import { tenants, vendorProfiles } from '../../_mock/data';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newTenantId = `tenant-v-${Date.now()}`;
  tenants.push({
    id: newTenantId,
    name: body.companyName,
    slug: body.companyName.toLowerCase().replace(/\s+/g, '-'),
    type: 'VENDOR',
    status: 'PENDING',
    planTier: 'FREE',
    country: body.country ?? 'US',
    website: body.website ?? null,
    vatId: body.vatId ?? null,
    address: {},
    apiCallsUsed: 0,
    apiCallsLimit: 1000,
    createdAt: new Date().toISOString(),
  } as typeof tenants[0]);
  vendorProfiles.push({
    tenantId: newTenantId,
    categories: body.categories ?? [],
    verificationStatus: 'PENDING',
    rating: null,
    reviewCount: 0,
    leadTimeDays: body.leadTimeDays ?? null,
    moq: body.moq ?? null,
    preferredCurrencies: ['USD'],
    certifications: [],
  });
  return Response.json({ message: 'Registration submitted for review' }, { status: 201 });
}
