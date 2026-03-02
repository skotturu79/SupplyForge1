'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { apiClient } from '@/lib/api-client';

type Range = '7d' | '30d' | '90d' | '1y';

interface AnalyticsOverview {
  kpis: {
    totalDocuments: number;
    totalInvoiceValue: number;
    activePartners: number;
    avgProcessingHours: number;
  };
  volumeByDay: { date: string; count: number }[];
  byType: { type: string; count: number }[];
  topPartners: { name: string; documents: number; invoiceValue: number; lastActivity: string }[];
  matchRate: { matched: number; disputed: number; pending: number };
}

const RANGES: { id: Range; label: string }[] = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: '1y', label: '1 year' },
];

const TYPE_COLORS: Record<string, string> = {
  PO: '#3b82f6', INVOICE: '#10b981', ASN: '#f59e0b', BOL: '#8b5cf6', LABEL: '#ef4444',
};

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d');

  const { data, isLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics', range],
    queryFn: () => apiClient.get('/analytics/overview', { params: { range } }).then((r) => r.data),
  });

  const matchTotal = data
    ? data.matchRate.matched + data.matchRate.disputed + data.matchRate.pending
    : 0;
  const matchPct = matchTotal > 0 ? Math.round((data!.matchRate.matched / matchTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Supply chain performance overview</p>
        </div>
        {/* Range selector */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="card p-5 h-32 animate-pulse bg-gray-50" />)
        ) : (
          <>
            <StatCard label="Total Documents" value={data?.kpis.totalDocuments.toLocaleString() ?? '—'} icon="📄" />
            <StatCard
              label="Total Invoice Value"
              value={data ? `$${(data.kpis.totalInvoiceValue / 1000).toFixed(1)}k` : '—'}
              icon="💰"
            />
            <StatCard label="Active Partners" value={data?.kpis.activePartners.toLocaleString() ?? '—'} icon="🤝" />
            <StatCard
              label="Avg Processing Time"
              value={data ? `${data.kpis.avgProcessingHours.toFixed(1)}h` : '—'}
              sub="from creation to acceptance"
              icon="⏱️"
            />
          </>
        )}
      </div>

      {/* Volume Chart */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Document Volume</h2>
        {isLoading ? (
          <div className="h-64 bg-gray-50 rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data?.volumeByDay ?? []} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#volGrad)" name="Documents" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By Type */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">By Document Type</h2>
          {isLoading ? (
            <div className="h-48 bg-gray-50 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.byType ?? []} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Documents" radius={[4, 4, 0, 0]}>
                  {(data?.byType ?? []).map((entry) => (
                    <rect key={entry.type} fill={TYPE_COLORS[entry.type] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Invoice Match Rate */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-2">3-Way Match Rate</h2>
          <p className="text-xs text-gray-400 mb-4">PO + ASN + Invoice auto-reconciliation</p>
          {isLoading ? (
            <div className="h-48 bg-gray-50 rounded animate-pulse" />
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-5xl font-bold text-gray-900">{matchPct}%</p>
                <p className="text-sm text-gray-500 mt-1">Auto-matched</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Matched', value: data?.matchRate.matched ?? 0, color: 'bg-green-500' },
                  { label: 'Disputed', value: data?.matchRate.disputed ?? 0, color: 'bg-red-500' },
                  { label: 'Pending', value: data?.matchRate.pending ?? 0, color: 'bg-yellow-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`} />
                    <span className="text-xs text-gray-600 flex-1">{item.label}</span>
                    <span className="text-xs font-medium text-gray-900">{item.value.toLocaleString()}</span>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: matchTotal > 0 ? `${(item.value / matchTotal) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Partners */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Top Partners by Volume</h2>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50">
              <tr>
                {['Partner', 'Documents', 'Invoice Value', 'Last Activity'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {(data?.topPartners ?? []).length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">No data yet</td></tr>
              ) : (
                (data?.topPartners ?? []).map((p) => (
                  <tr key={p.name} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{p.documents.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">${p.invoiceValue.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(p.lastActivity).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
