import { ok, created, vendorTeam, VENDOR1_TENANT_ID } from '../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function GET() {
  const members = vendorTeam.filter((m) => m.tenantId === TENANT_ID);
  return ok({ data: members, total: members.length });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const now  = new Date().toISOString();
  const fn   = (body.firstName ?? '').trim();
  const ln   = (body.lastName  ?? '').trim();
  const member = {
    id:             `tm-${Date.now()}`,
    tenantId:       TENANT_ID,
    email:          body.email     ?? '',
    firstName:      fn,
    lastName:       ln,
    role:           body.role      ?? 'VIEWER',
    isActive:       false,
    mfaEnabled:     false,
    lastLoginAt:    null,
    invitedAt:      now,
    joinedAt:       null,
    invitedBy:      'tm-001',
    avatarInitials: `${fn[0] ?? '?'}${ln[0] ?? ''}`.toUpperCase(),
  } as typeof vendorTeam[0];
  vendorTeam.push(member);
  return created(member);
}
