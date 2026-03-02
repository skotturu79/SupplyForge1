import { NextRequest } from 'next/server';
import { ok, tenants, vendorProfiles } from '../_mock/data';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q        = (searchParams.get('search') ?? searchParams.get('q') ?? '').toLowerCase();
  const category = searchParams.get('category') ?? '';
  const country  = searchParams.get('country') ?? '';
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit    = Math.max(1, parseInt(searchParams.get('limit') ?? '12'));

  let vendors = tenants
    .filter(t => t.type === 'VENDOR')
    .map(t => {
      const profile = vendorProfiles.find(v => v.tenantId === t.id) ?? null;
      return {
        id:                 t.id,
        tenantId:           t.id,
        companyName:        t.name,
        country:            t.country,
        website:            t.website ?? null,
        createdAt:          t.createdAt,
        categories:         profile?.categories ?? [],
        verificationStatus: profile?.verificationStatus ?? 'PENDING',
        rating:             profile?.rating ?? null,
        reviewCount:        profile?.reviewCount ?? 0,
        leadTimeDays:       profile?.leadTimeDays ?? null,
        certifications:     profile?.certifications ?? [],
      };
    });

  if (q)        vendors = vendors.filter(v => v.companyName.toLowerCase().includes(q));
  if (category) vendors = vendors.filter(v => v.categories.includes(category));
  if (country)  vendors = vendors.filter(v => v.country === country);

  const total   = vendors.length;
  const offset  = (page - 1) * limit;
  const data    = vendors.slice(offset, offset + limit);
  const hasMore = offset + data.length < total;

  return ok({ data, meta: { total, page, limit, hasMore } });
}
