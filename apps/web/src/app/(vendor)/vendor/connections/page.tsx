'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Connection {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  tier: string;
  direction: 'SENT' | 'RECEIVED';
  requesterTenantId: string;
  targetTenantId: string;
  message?: string;
  createdAt: string;
  approvedAt?: string;
  partner: { id: string; name: string; country: string; type: string };
}

const tierColors: Record<string, string> = {
  STANDARD:  'bg-gray-100 text-gray-700',
  PREFERRED: 'bg-blue-100 text-blue-700',
  TRUSTED:   'bg-purple-100 text-purple-700',
};

const statusColors: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  APPROVED:  'bg-green-100 text-green-700',
  REJECTED:  'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-100 text-gray-500',
};

export default function VendorConnectionsPage() {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: connections, isLoading } = useQuery<Connection[]>({
    queryKey: ['vendor-connections'],
    queryFn: () => apiClient.get('/partners').then((r) => r.data?.data ?? r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/partners/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-connections'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.patch(`/partners/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-connections'] });
      setRejectId(null);
      setRejectReason('');
    },
  });

  const pending  = connections?.filter((c) => c.status === 'PENDING')  ?? [];
  const approved = connections?.filter((c) => c.status === 'APPROVED') ?? [];
  const others   = connections?.filter((c) => !['PENDING', 'APPROVED'].includes(c.status)) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Partner Connections</h1>
          <p className="page-subtitle">Businesses that exchange documents with you</p>
        </div>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="rounded border-2 border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-200 flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-600">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h2 className="font-semibold text-amber-800 text-sm">
              {pending.length} Pending Request{pending.length > 1 ? 's' : ''}
            </h2>
          </div>
          <div className="divide-y divide-amber-100">
            {pending.map((conn) => (
              <div key={conn.id} className="px-5 py-4 flex items-start justify-between gap-4 bg-white/60">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#32363A] text-sm">{conn.partner.name}</span>
                    <span className="text-xs text-[#6A6D70]">{conn.partner.country}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${tierColors[conn.tier] ?? 'bg-gray-100 text-gray-600'}`}>
                      {conn.tier}
                    </span>
                  </div>
                  {conn.message && (
                    <p className="text-xs text-[#6A6D70] mt-1 italic">"{conn.message}"</p>
                  )}
                  <div className="text-xs text-[#6A6D70] mt-1">
                    Requested {new Date(conn.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(conn.id)}
                    disabled={approveMutation.isPending}
                    className="rounded px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#107E3E' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectId(conn.id)}
                    className="rounded border border-red-200 text-[#BB0000] text-sm px-3 py-1.5 font-medium hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Partners */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-[#32363A]">Active Partners ({approved.length})</h2>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded animate-pulse" />)}
          </div>
        ) : approved.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-[#6A6D70]">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <p className="text-sm text-[#6A6D70]">No active connections yet.</p>
            <p className="text-xs text-[#6A6D70] mt-1 opacity-70">
              Businesses will send you connection requests — they will appear above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDEDED]">
            {approved.map((conn) => (
              <div key={conn.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F5F6F7]">
                <div className="w-10 h-10 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 bg-green-100 text-[#107E3E]">
                  {conn.partner.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#32363A] text-sm">{conn.partner.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${tierColors[conn.tier] ?? 'bg-gray-100 text-gray-600'}`}>
                      {conn.tier}
                    </span>
                  </div>
                  <div className="text-xs text-[#6A6D70] mt-0.5">
                    {conn.partner.country}
                    {conn.approvedAt && ` · Connected ${new Date(conn.approvedAt).toLocaleDateString()}`}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded font-medium flex-shrink-0 ${statusColors[conn.status]}`}>
                  {conn.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejected / Suspended */}
      {others.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-[#6A6D70]">Other ({others.length})</h2>
          </div>
          <div className="divide-y divide-[#EDEDED]">
            {others.map((conn) => (
              <div key={conn.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-[#6A6D70]">
                  {conn.partner.name[0].toUpperCase()}
                </div>
                <div className="flex-1 text-sm text-[#6A6D70]">{conn.partner.name}</div>
                <span className={`text-xs px-2.5 py-1 rounded font-medium ${statusColors[conn.status]}`}>
                  {conn.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded border border-[#EDEDED] shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-[#32363A] mb-4">Reject Connection Request</h3>
            <textarea
              className="input w-full h-24 resize-none"
              placeholder="Reason for rejection (required, min 10 characters)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="btn-secondary text-sm">
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectId, reason: rejectReason })}
                disabled={rejectReason.length < 10 || rejectMutation.isPending}
                className="rounded px-4 py-2 text-sm font-medium text-white bg-[#BB0000] hover:bg-red-800 disabled:opacity-50 transition-colors"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
