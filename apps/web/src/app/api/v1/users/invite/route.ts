import { NextRequest } from 'next/server';
import { ok, users, BIZ_TENANT_ID } from '../../_mock/data';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newUser = {
    id: `user-biz-${Date.now()}`,
    tenantId: BIZ_TENANT_ID,
    email: body.email,
    firstName: body.firstName ?? body.email.split('@')[0],
    lastName: body.lastName ?? '',
    role: body.role ?? 'OPERATOR',
    mfaEnabled: false,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return ok({ message: `Invitation sent to ${body.email}`, user: newUser });
}
