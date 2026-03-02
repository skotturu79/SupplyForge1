'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Document {
  id: string;
  type: string;
  status: string;
  referenceNumber: string;
  totalAmount?: number;
  currency: string;
  senderTenantId: string;
  createdAt: string;
  updatedAt: string;
}

const statusBadge: Record<string, string> = {
  DRAFT: 'badge-draft', SENT: 'badge-sent',
  ACKNOWLEDGED: 'badge-acknowledged', ACCEPTED: 'badge-accepted',
  REJECTED: 'badge-rejected', CANCELLED: 'badge-cancelled',
};

const actionable = ['SENT', 'ACKNOWLEDGED'];

export default function VendorDocumentsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);

  const { data, isLoading } = useQuery<{ data: Document[]; meta: { total: number } }>({
    queryKey: ['vendor-documents', filter],
    queryFn: () =>
      apiClient.get('/documents', {
        params: { status: filter || undefined, limit: 50 },
      }).then((r) => r.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, comment }: { id: string; action: string; comment?: string }) =>
      apiClient.patch(`/documents/${id}/${action}`, comment ? { comment, reason: comment } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-documents'] });
      setSelected(null);
      setActionType(null);
      setRejectReason('');
    },
  });

  const pendingAction = data?.data.filter((d) => actionable.includes(d.status)) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500 mt-1">Purchase orders and documents from your partners</p>
      </div>

      {/* Action-required banner */}
      {pendingAction.length > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-3">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-600 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-blue-800">
            <strong>{pendingAction.length}</strong> document{pendingAction.length > 1 ? 's' : ''} need{pendingAction.length === 1 ? 's' : ''} your attention.
          </p>
          <button
            onClick={() => setFilter('SENT')}
            className="ml-auto text-xs text-blue-700 underline hover:no-underline"
          >
            Show pending
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'SENT', 'ACKNOWLEDGED', 'ACCEPTED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              filter === s
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Reference', 'Type', 'Status', 'Amount', 'Received', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : !data?.data?.length ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                  No documents found.
                </td>
              </tr>
            ) : (
              data.data.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => router.push(`/vendor/documents/${doc.id}`)}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      {doc.referenceNumber}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-medium text-gray-500">{doc.type}</td>
                  <td className="px-5 py-3.5">
                    <span className={statusBadge[doc.status] || 'badge-draft'}>{doc.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-900">
                    {doc.totalAmount ? `${doc.currency} ${doc.totalAmount.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    {actionable.includes(doc.status) && (
                      <div className="flex gap-1.5">
                        {/* Acknowledge navigates to detail page for per-line acknowledgement */}
                        {doc.status === 'SENT' && (
                          <button
                            onClick={() => router.push(`/vendor/documents/${doc.id}`)}
                            className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        {doc.status === 'ACKNOWLEDGED' && (
                          <button
                            onClick={() => { setSelected(doc); setActionType('accept'); }}
                            className="text-xs px-2.5 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors"
                          >
                            Accept
                          </button>
                        )}
                        <button
                          onClick={() => { setSelected(doc); setActionType('reject'); }}
                          className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {data?.meta && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            {data.meta.total} total document{data.meta.total !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Accept / Reject modal (no line-item data needed for these actions) */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selected.referenceNumber}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {actionType === 'accept' ? 'Accept this document' : 'Reject this document'}
                </p>
              </div>
              <button
                onClick={() => { setSelected(null); setActionType(null); setRejectReason(''); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">Type</span>
                  <span className="font-medium">{selected.type}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">Status</span>
                  <span className={statusBadge[selected.status] || 'badge-draft'}>{selected.status}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">Amount</span>
                  <span className="font-medium">
                    {selected.totalAmount ? `${selected.currency} ${selected.totalAmount.toLocaleString()}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">Received</span>
                  <span>{new Date(selected.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {actionType === 'reject' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection reason</label>
                  <textarea
                    className="input w-full h-20 resize-none"
                    placeholder="Explain why you are rejecting this document (min 10 chars)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}

              {actionType === 'accept' && (
                <p className="text-sm text-gray-600 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                  This will mark the document as <strong>Accepted</strong> and notify the sender.
                </p>
              )}
            </div>

            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button
                onClick={() => { setSelected(null); setActionType(null); setRejectReason(''); }}
                className="btn-secondary"
              >
                Cancel
              </button>

              {actionType === 'accept' && (
                <button
                  onClick={() => actionMutation.mutate({ id: selected.id, action: 'accept' })}
                  disabled={actionMutation.isPending}
                  className="rounded-lg text-white text-sm px-4 py-2 font-medium disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: '#107E3E' }}
                >
                  {actionMutation.isPending ? 'Processing…' : 'Confirm Accept'}
                </button>
              )}

              {actionType === 'reject' && (
                <button
                  onClick={() => actionMutation.mutate({ id: selected.id, action: 'reject', comment: rejectReason })}
                  disabled={rejectReason.length < 10 || actionMutation.isPending}
                  className="rounded-lg bg-red-600 text-white text-sm px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {actionMutation.isPending ? 'Processing…' : 'Confirm Rejection'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
