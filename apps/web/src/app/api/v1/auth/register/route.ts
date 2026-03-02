import { NextRequest } from 'next/server';
import { users, tenants, ok } from '../../_mock/data';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password, firstName, lastName, companyName, country, planTier } = body;

  if (!email || !password || !firstName || !lastName || !companyName) {
    return Response.json({ message: 'All required fields must be provided' }, { status: 400 });
  }

  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return Response.json({ message: 'An account with this email already exists' }, { status: 409 });
  }

  const tenantId = `tenant-biz-${Date.now()}`;
  const userId   = `user-biz-${Date.now()}`;

  tenants.push({
    id: tenantId, name: companyName,
    slug: companyName.toLowerCase().replace(/\s+/g, '-'),
    type: 'BUSINESS', status: 'VERIFIED', planTier: planTier ?? 'FREE',
    country: country ?? 'US', website: null, vatId: null,
    address: {}, apiCallsUsed: 0, apiCallsLimit: 1000,
    createdAt: new Date().toISOString(),
  } as unknown as Parameters<typeof tenants.push>[0]);

  users.push({
    id: userId, tenantId, email, firstName, lastName,
    role: 'ADMIN', mfaEnabled: false, isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  return Response.json(
    { message: 'Account created. You can now sign in.', email },
    { status: 201 },
  );
}
