'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface PartnerConnection {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  direction: 'SENT' | 'RECEIVED';
  tier: string;
  requesterTenantId: string;
  targetTenantId: string;
  partner: { id: string; name: string; country?: string; type?: string };
  createdAt: string;
  approvedAt?: string;
}

type TabId = 'connected' | 'pending' | 'received';

export default function PartnersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>('connected');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: connections = [], isLoading } = useQuery<PartnerConnection[]>({
    queryKey: ['partners'],
    queryFn: () => apiClient.get('/partners').then((r) => r.data?.data ?? r.data),
  });

  const inviteMutation = useMutation({
    mutationFn: (targetEmail: string) => apiClient.post('/partners', { targetEmail }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setShowInvite(false); setInviteEmail(''); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/partners/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/partners/${id}/reject`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setRejectId(null); setRejectReason(''); },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/partners/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners'] }),
  });

  const connected = connections.filter((c) => c.status === 'APPROVED');
  const pending   = connections.filter((c) => c.status === 'PENDING' && c.direction === 'SENT');
  const received  = connections.filter((c) => c.status === 'PENDING' && c.direction === 'RECEIVED');

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'connected', label: 'Connected', count: connected.length },
    { id: 'pending',   label: 'Sent',      count: pending.length },
    { id: 'received',  label: 'Received',  count: received.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your business partner connections</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="btn-primary"
        >
          + Invite Partner
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  tab === t.id ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 h-16 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : (
        <>
          {/* Connected */}
          {tab === 'connected' && (
            connected.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🤝</div>
                <p className="text-sm text-gray-500">No connected partners yet.</p>
                <p className="text-xs text-gray-400 mt-1">Send an invitation to get started.</p>
                <button onClick={() => setShowInvite(true)} className="mt-4 text-sm text-brand-600 hover:text-brand-700 underline">
                  Invite your first partner
                </button>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Partner', 'Connected Since', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {connected.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                              {(c.partner?.name || '?')[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {c.partner?.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {c.approvedAt ? new Date(c.approvedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => removeMutation.mutate(c.id)}
                            disabled={removeMutation.isPending}
                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded px-2 py-1 transition-colors"
                          >
                            Disconnect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Sent / Pending */}
          {tab === 'pending' && (
            pending.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📤</div>
                <p className="text-sm text-gray-500">No pending invitations sent.</p>
              </div>
            ) : (
              <div className="card divide-y divide-gray-100">
                {pending.map((c) => (
                  <div key={c.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.partner?.name || c.targetTenantId}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Sent {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge-acknowledged">Pending</span>
                      <button
                        onClick={() => removeMutation.mutate(c.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Received */}
          {tab === 'received' && (
            received.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📬</div>
                <p className="text-sm text-gray-500">No incoming connection requests.</p>
              </div>
            ) : (
              <div className="card divide-y divide-gray-100">
                {received.map((c) => (
                  <div key={c.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.partner?.name || c.requesterTenantId}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Received {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMutation.mutate(c.id)}
                        disabled={approveMutation.isPending}
                        className="text-xs px-3 py-1.5 rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-medium transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectId(c.id)}
                        className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Invite a Partner</h3>
              <button onClick={() => { setShowInvite(false); setInviteEmail(''); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner Email Address</label>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input"
                  placeholder="contact@partner-company.com"
                  type="email"
                />
                <p className="text-xs text-gray-400 mt-1">
                  We&apos;ll look up the SupplyForge account associated with this email.
                </p>
              </div>
              {inviteMutation.isError && (
                <p className="text-xs text-red-600">Failed to send invitation. Please check the email and try again.</p>
              )}
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowInvite(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => inviteMutation.mutate(inviteEmail)}
                disabled={!inviteEmail || inviteMutation.isPending}
                className="btn-primary"
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Reject Connection Request</h3>
              <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional, min 10 chars if provided)</label>
              <textarea
                className="input h-20 resize-none"
                placeholder="Let them know why you are declining..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="btn-secondary">Cancel</button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectId, reason: rejectReason })}
                disabled={rejectMutation.isPending || (rejectReason.length > 0 && rejectReason.length < 10)}
                className="rounded-lg bg-red-600 text-white text-sm px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
