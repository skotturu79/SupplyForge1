import { ok, tenants, users } from '../../_mock/data';

export async function GET() {
  return ok({
    kpis: {
      totalTenants:    tenants.length,
      activeTenants:   tenants.filter(t => t.status === 'VERIFIED').length,
      pendingVendors:  tenants.filter(t => t.type === 'VENDOR' && t.status === 'PENDING').length,
      totalUsers:      users.length,
      apiCallsToday:   1284,
      documentsToday:  17,
    },
    recentRegistrations: tenants
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(t => ({ id: t.id, name: t.name, type: t.type, status: t.status, createdAt: t.createdAt })),
    systemHealth: {
      api:        { status: 'UP',      latencyMs: 42  },
      database:   { status: 'UP',      latencyMs: 8   },
      queue:      { status: 'UP',      latencyMs: 12  },
      storage:    { status: 'UP',      latencyMs: 95  },
      search:     { status: 'DEGRADED', latencyMs: 320 },
    },
  });
}
