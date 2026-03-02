import { NextRequest } from 'next/server';
import { users, tenants, ok } from '../../_mock/data';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email    = (body.email    ?? '').trim().toLowerCase();
  const password = (body.password ?? '');

  if (!email || !password) {
    return Response.json({ message: 'Email and password are required' }, { status: 400 });
  }

  // Mock: any non-empty password accepted — just verify the account exists and is active
  const user = users.find(u => u.email.toLowerCase() === email && u.isActive);
  if (!user) {
    return Response.json({ message: 'Invalid email or password' }, { status: 401 });
  }

  const tenant = tenants.find(t => t.id === user.tenantId);

  return ok({
    token: `mock-jwt-${user.id}-${Date.now()}`,
    user: {
      id:         user.id,
      email:      user.email,
      firstName:  user.firstName,
      lastName:   user.lastName,
      tenantId:   user.tenantId,
      tenantName: tenant?.name ?? '',
      tenantType: tenant?.type ?? 'BUSINESS',
      role:       user.role,
    },
  });
}
