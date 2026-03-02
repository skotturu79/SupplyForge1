'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tenantId: string;
  tenantName: string;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const STATUS_FILTERS = ['', 'ACTIVE', 'INACTIVE', 'SUSPENDED'];

const statusBadge: Record<string, string> = {
  ACTIVE:    'bg-green-100 text-green-700',
  INACTIVE:  'bg-gray-100 text-gray-500',
  SUSPENDED: 'bg-red-100 text-red-600',
};

const roleBadge: Record<string, string> = {
  ADMIN:  'bg-indigo-50 text-indigo-700',
  MEMBER: 'bg-gray-100 text-gray-600',
  VIEWER: 'bg-purple-50 text-purple-700',
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery<{ data: User[]; meta: { total: number; hasMore: boolean } }>({
    queryKey: ['admin-users', debouncedSearch, statusFilter, page],
    queryFn: () =>
      apiClient.get('/admin/users', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          page,
          limit: 25,
        },
      }).then((r) => r.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/users/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setSelected(null);
    },
  });

  const users = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">All user accounts across the platform</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input flex-1 min-w-48"
          placeholder="Search by name, email, or company..."
        />
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Company', 'Role', 'MFA', 'Status', 'Last Login', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{u.tenantName}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${roleBadge[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.mfaEnabled
                      ? <span className="text-xs text-green-600 font-medium">✓ On</span>
                      : <span className="text-xs text-gray-400">Off</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge[u.status] || 'bg-gray-100 text-gray-500'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5">
                      <button onClick={() => setSelected(u)} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1">
                        View
                      </button>
                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: u.id, status: 'SUSPENDED' })}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 transition-colors"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: u.id, status: 'ACTIVE' })}
                          className="text-xs text-green-600 hover:text-green-700 border border-green-200 rounded px-2 py-1 transition-colors"
                        >
                          Enable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {data?.meta && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{data.meta.total} users total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="btn-secondary text-xs py-1 px-2">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={!data.meta.hasMore} className="btn-secondary text-xs py-1 px-2">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* User detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{selected.firstName} {selected.lastName}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'User ID',    value: selected.id },
                  { label: 'Email',      value: selected.email },
                  { label: 'Company',    value: selected.tenantName },
                  { label: 'Role',       value: selected.role },
                  { label: 'Status',     value: selected.status },
                  { label: 'MFA',        value: selected.mfaEnabled ? 'Enabled' : 'Disabled' },
                  { label: 'Last Login', value: selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleString() : 'Never' },
                  { label: 'Joined',     value: new Date(selected.createdAt).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-xs text-gray-400 block mb-0.5">{label}</span>
                    <span className="font-medium text-gray-900 text-sm break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setSelected(null)} className="btn-secondary">Close</button>
              {selected.status === 'ACTIVE' ? (
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selected.id, status: 'SUSPENDED' })}
                  disabled={updateStatusMutation.isPending}
                  className="rounded-lg bg-red-600 text-white text-sm px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Disable User
                </button>
              ) : (
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selected.id, status: 'ACTIVE' })}
                  disabled={updateStatusMutation.isPending}
                  className="rounded-lg bg-green-600 text-white text-sm px-4 py-2 font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Enable User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
