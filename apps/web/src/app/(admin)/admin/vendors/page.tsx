'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface VendorApplication {
  tenantId: string;
  companyName: string;
  contactName: string;
  email: string;
  country: string;
  website?: string;
  vatId?: string;
  categories: string[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export default function AdminVendorsPage() {
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState<VendorApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: pending = [], isLoading: pendingLoading } = useQuery<VendorApplication[]>({
    queryKey: ['admin-vendors-pending'],
    queryFn: () => apiClient.get('/admin/vendors', { params: { status: 'PENDING' } }).then((r) => r.data),
  });

  const { data: processed = [], isLoading: processedLoading } = useQuery<VendorApplication[]>({
    queryKey: ['admin-vendors-processed'],
    queryFn: () => apiClient.get('/admin/vendors', { params: { status: 'VERIFIED,REJECTED', limit: 20 } }).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (tenantId: string) => apiClient.post(`/admin/vendors/${tenantId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vendors-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-vendors-processed'] });
      setReviewing(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ tenantId, reason }: { tenantId: string; reason: string }) =>
      apiClient.post(`/admin/vendors/${tenantId}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vendors-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-vendors-processed'] });
      setReviewing(null);
      setRejectReason('');
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve vendor registration applications</p>
      </div>

      {/* Pending queue */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-semibold text-gray-900">Awaiting Review</h2>
          {pending.length > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-full font-medium">
              {pending.length} pending
            </span>
          )}
        </div>

        {pendingLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-4 h-20 animate-pulse bg-gray-50" />)}</div>
        ) : pending.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm text-gray-500">No vendor applications awaiting review.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Company', 'Contact', 'Country', 'Categories', 'Submitted', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {pending.map((v) => (
                  <tr key={v.tenantId} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{v.companyName}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-700">{v.contactName}</p>
                      <p className="text-xs text-gray-400">{v.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{v.country}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {v.categories.slice(0, 2).map((c) => (
                          <span key={c} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{c}</span>
                        ))}
                        {v.categories.length > 2 && <span className="text-xs text-gray-400">+{v.categories.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(v.submittedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setReviewing(v)}
                        className="text-xs px-3 py-1.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-medium transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recently processed */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Recently Processed</h2>
        {processedLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="card p-3 h-14 animate-pulse bg-gray-50" />)}</div>
        ) : processed.length === 0 ? (
          <p className="text-sm text-gray-400">No processed applications yet.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Company', 'Decision', 'Decision Date', 'Reviewed By'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {processed.map((v) => (
                  <tr key={v.tenantId} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{v.companyName}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        v.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {v.verificationStatus === 'VERIFIED' ? '✓ Approved' : '✕ Rejected'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {v.reviewedAt ? new Date(v.reviewedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{v.reviewedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">Review: {reviewing.companyName}</h3>
              <button onClick={() => { setReviewing(null); setRejectReason(''); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Company',  value: reviewing.companyName },
                  { label: 'Contact',  value: reviewing.contactName },
                  { label: 'Email',    value: reviewing.email },
                  { label: 'Country',  value: reviewing.country },
                  { label: 'Website',  value: reviewing.website || '—' },
                  { label: 'VAT ID',   value: reviewing.vatId || '—' },
                  { label: 'Submitted', value: new Date(reviewing.submittedAt).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-xs text-gray-400 block mb-0.5">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>

              <div>
                <span className="text-xs text-gray-400 block mb-2">Categories</span>
                <div className="flex flex-wrap gap-1.5">
                  {reviewing.categories.map((c) => (
                    <span key={c} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{c}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-gray-400 font-normal">(required if rejecting, min 20 chars)</span>
                </label>
                <textarea
                  className="input w-full h-20 resize-none"
                  placeholder="Explain why this vendor application is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-3 justify-end sticky bottom-0 bg-white border-t border-gray-100 pt-4">
              <button onClick={() => { setReviewing(null); setRejectReason(''); }} className="btn-secondary">Cancel</button>
              <button
                onClick={() => rejectMutation.mutate({ tenantId: reviewing.tenantId, reason: rejectReason })}
                disabled={rejectReason.length < 20 || rejectMutation.isPending}
                className="rounded-lg bg-red-600 text-white text-sm px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => approveMutation.mutate(reviewing.tenantId)}
                disabled={approveMutation.isPending}
                className="rounded-lg bg-green-600 text-white text-sm px-4 py-2 font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {approveMutation.isPending ? 'Approving...' : '✓ Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
