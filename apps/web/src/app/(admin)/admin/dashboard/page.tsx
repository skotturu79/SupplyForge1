'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface AdminOverview {
  kpis: {
    totalTenants: number;
    totalUsers: number;
    documentsToday: number;
    activeVendors: number;
    tenantsChange: number;
    usersChange: number;
    documentsTodayChange: number;
    activeVendorsChange: number;
  };
  recentRegistrations: Array<{
    id: string;
    companyName: string;
    type: 'BUSINESS' | 'VENDOR';
    status: string;
    createdAt: string;
  }>;
  pendingVendors: number;
  systemHealth: {
    apiLatency: number;
    errorRate: number;
    uptime: number;
  };
}

function KpiCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl">{icon}</span>
        {change !== undefined && (
          <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

const statusBadge: Record<string, string> = {
  ACTIVE:    'bg-green-100 text-green-700',
  INACTIVE:  'bg-gray-100 text-gray-500',
  SUSPENDED: 'bg-red-100 text-red-600',
  PENDING:   'bg-yellow-100 text-yellow-700',
};

export default function AdminDashboardPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<AdminOverview>({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient.get('/admin/overview').then((r) => r.data),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and system health</p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['admin-overview'] })}
          className="btn-secondary text-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="card p-5 h-28 animate-pulse bg-gray-50" />)
        ) : (
          <>
            <KpiCard label="Total Tenants"      value={data?.kpis.totalTenants ?? '—'}      change={data?.kpis.tenantsChange}        icon="🏢" />
            <KpiCard label="Total Users"        value={data?.kpis.totalUsers ?? '—'}        change={data?.kpis.usersChange}          icon="👤" />
            <KpiCard label="Documents Today"    value={data?.kpis.documentsToday ?? '—'}    change={data?.kpis.documentsTodayChange} icon="📄" />
            <KpiCard label="Active Vendors"     value={data?.kpis.activeVendors ?? '—'}     change={data?.kpis.activeVendorsChange}  icon="🏭" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Registrations */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Registrations</h2>
            <Link href="/admin/tenants" className="text-xs text-indigo-600 hover:text-indigo-700">View all →</Link>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />)}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50">
                <tr>
                  {['Company', 'Type', 'Status', 'Registered'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.recentRegistrations ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">No recent registrations</td></tr>
                ) : (
                  (data?.recentRegistrations ?? []).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{t.companyName}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${t.type === 'VENDOR' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge[t.status] || 'bg-gray-100 text-gray-500'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending vendors alert */}
          {(data?.pendingVendors ?? 0) > 0 && (
            <div className="card p-5 border-l-4 border-yellow-400 bg-yellow-50/50">
              <p className="text-sm font-semibold text-yellow-900">
                {data?.pendingVendors} vendor{data!.pendingVendors > 1 ? 's' : ''} awaiting approval
              </p>
              <p className="text-xs text-yellow-700 mt-1">Review and approve pending vendor applications.</p>
              <Link href="/admin/vendors" className="mt-3 inline-block text-xs font-medium text-yellow-800 underline hover:no-underline">
                Review now →
              </Link>
            </div>
          )}

          {/* System health */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">System Health</h2>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />)}</div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'API Latency', value: `${data?.systemHealth.apiLatency ?? '—'} ms`, good: (data?.systemHealth.apiLatency ?? 0) < 200 },
                  { label: 'Error Rate',  value: `${data?.systemHealth.errorRate ?? '—'}%`,   good: (data?.systemHealth.errorRate ?? 0) < 1 },
                  { label: 'Uptime',      value: `${data?.systemHealth.uptime ?? '—'}%`,       good: (data?.systemHealth.uptime ?? 0) >= 99.9 },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{stat.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{stat.value}</span>
                      <div className={`w-2 h-2 rounded-full ${stat.good ? 'bg-green-400' : 'bg-red-400'}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="space-y-1.5">
              {[
                { href: '/admin/vendors',  label: 'Approve Vendors',      icon: '✅' },
                { href: '/admin/tenants',  label: 'Manage Tenants',       icon: '🏢' },
                { href: '/admin/users',    label: 'View Users',           icon: '👤' },
              ].map((a) => (
                <Link key={a.href} href={a.href} className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <span>{a.icon}</span>{a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
