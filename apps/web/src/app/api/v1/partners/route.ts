import { NextRequest } from 'next/server';
import { ok, created, partnerConnections, tenants, vendorProfiles, BIZ_TENANT_ID } from '../_mock/data';

function enrich(conn: typeof partnerConnections[0]) {
  const isRequester = conn.requesterTenantId === BIZ_TENANT_ID;
  const peerId = isRequester ? conn.targetTenantId : conn.requesterTenantId;
  const peer = tenants.find(t => t.id === peerId);
  const profile = vendorProfiles.find(v => v.tenantId === peerId);
  return {
    ...conn,
    direction: isRequester ? 'SENT' : 'RECEIVED',
    partner: { id: peerId, name: peer?.name, country: peer?.country, type: peer?.type, website: peer?.website, vendorProfile: profile ?? null },
  };
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  let list = partnerConnections.filter(
    c => c.requesterTenantId === BIZ_TENANT_ID || c.targetTenantId === BIZ_TENANT_ID,
  );
  if (status) list = list.filter(c => c.status === status);
  return ok({ data: list.map(enrich), total: list.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newConn = {
    id: `conn-${Date.now()}`,
    requesterTenantId: BIZ_TENANT_ID,
    targetTenantId: body.targetTenantId ?? 'tenant-v-003',
    status: 'PENDING',
    tier: 'STANDARD',
    message: body.message ?? '',
    approvedAt: null,
    createdAt: new Date().toISOString(),
  };
  partnerConnections.push(newConn);
  return created(enrich(newConn));
}
