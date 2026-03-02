'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface LineItem {
  id: string;
  lineNumber: number;
  sku: string;
  description: string;
  orderedQty: number;
  unit: string;
  unitPrice: number;
}

interface LineAcknowledgement {
  lineItemId: string;
  confirmedQty: number;
  status: string;
  reason?: string;
}

interface DocumentDetail {
  id: string;
  type: string;
  status: string;
  referenceNumber: string;
  totalAmount?: number;
  currency: string;
  dueDate?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  senderTenantId: string;
  receiverTenantId: string;
  sender:   { id: string; name: string; country: string } | null;
  receiver: { id: string; name: string; country: string } | null;
  lineItems: LineItem[];
  lineAcknowledgements: LineAcknowledgement[];
}

const statusBadge: Record<string, string> = {
  DRAFT: 'badge-draft', SENT: 'badge-sent',
  ACKNOWLEDGED: 'badge-acknowledged', ACCEPTED: 'badge-accepted',
  REJECTED: 'badge-rejected', CANCELLED: 'badge-cancelled',
  PAID: 'badge-paid', DISPUTED: 'badge-acknowledged',
  PARTIAL: 'badge-acknowledged',
};

const typeLabel: Record<string, string> = {
  PO: 'Purchase Order', INVOICE: 'Invoice', ASN: 'Advance Ship Notice',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[#6A6D70] mb-0.5">{label}</dt>
      <dd className="text-sm font-medium text-[#32363A]">{value ?? '—'}</dd>
    </div>
  );
}

function lineStatus(confirmedQty: number, orderedQty: number): string {
  if (confirmedQty <= 0) return 'REJECTED';
  if (confirmedQty < orderedQty) return 'PARTIAL';
  return 'ACCEPTED';
}

export default function VendorDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  // Per-line acknowledgement state: { [lineItemId]: { confirmedQty, reason } }
  const [lineAcks, setLineAcks] = useState<Record<string, { confirmedQty: number; reason: string }>>({});

  const { data: doc, isLoading, isError } = useQuery<DocumentDetail>({
    queryKey: ['vendor-document', id],
    queryFn: () => apiClient.get(`/documents/${id}`).then((r) => r.data),
  });

  // Initialise line ack state when doc loads
  useEffect(() => {
    if (!doc?.lineItems?.length) return;
    setLineAcks(
      Object.fromEntries(
        doc.lineItems.map((item) => {
          const existing = doc.lineAcknowledgements.find((a) => a.lineItemId === item.id);
          return [item.id, {
            confirmedQty: existing?.confirmedQty ?? item.orderedQty,
            reason: existing?.reason ?? '',
          }];
        }),
      ),
    );
  }, [doc]);

  const actionMutation = useMutation({
    mutationFn: ({ action, comment, lineAcknowledgements }: {
      action: string;
      comment?: string;
      lineAcknowledgements?: LineAcknowledgement[];
    }) =>
      apiClient.patch(
        `/documents/${id}/${action}`,
        lineAcknowledgements
          ? { lineAcknowledgements }
          : comment ? { comment, reason: comment } : {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-document', id] });
      qc.invalidateQueries({ queryKey: ['vendor-documents'] });
      setShowReject(false);
      setRejectReason('');
    },
  });

  const handleAcknowledge = () => {
    if (!doc?.lineItems?.length) {
      actionMutation.mutate({ action: 'acknowledge' });
      return;
    }
    const payload: LineAcknowledgement[] = doc.lineItems.map((item) => {
      const ack = lineAcks[item.id] ?? { confirmedQty: item.orderedQty, reason: '' };
      return {
        lineItemId: item.id,
        confirmedQty: ack.confirmedQty,
        status: lineStatus(ack.confirmedQty, item.orderedQty),
        ...(ack.reason ? { reason: ack.reason } : {}),
      };
    });
    actionMutation.mutate({ action: 'acknowledge', lineAcknowledgements: payload });
  };

  const updateLineAck = (itemId: string, field: 'confirmedQty' | 'reason', value: number | string) => {
    setLineAcks((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-48" />
        <div className="card p-6 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-[#BB0000] font-medium">Document not found.</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4 text-xs">
          Go Back
        </button>
      </div>
    );
  }

  const canAcknowledge = doc.status === 'SENT';
  const canAccept      = doc.status === 'ACKNOWLEDGED';
  const canReject      = ['SENT', 'ACKNOWLEDGED'].includes(doc.status);
  const hasLineItems   = doc.lineItems.length > 0;

  // Compute totals for the acknowledge summary
  const confirmedTotal = hasLineItems
    ? doc.lineItems.reduce((sum, item) => {
        const qty = lineAcks[item.id]?.confirmedQty ?? item.orderedQty;
        return sum + qty * item.unitPrice;
      }, 0)
    : 0;

  const linesNeedingReason = hasLineItems
    ? doc.lineItems.filter((item) => {
        const ack = lineAcks[item.id];
        return ack && ack.confirmedQty < item.orderedQty;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded border border-[#EDEDED] bg-white flex items-center justify-center hover:bg-[#F5F6F7] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h1 className="page-title">{doc.referenceNumber}</h1>
            <p className="page-subtitle">{typeLabel[doc.type] ?? doc.type}</p>
          </div>
        </div>
        <span className={statusBadge[doc.status] ?? 'badge-draft'}>{doc.status}</span>
      </div>

      {/* Non-acknowledge action buttons (Accept / Reject) */}
      {(canAccept || canReject) && !canAcknowledge && (
        <div className="flex gap-2 flex-wrap">
          {canAccept && (
            <button
              onClick={() => actionMutation.mutate({ action: 'accept' })}
              disabled={actionMutation.isPending}
              className="rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#107E3E' }}
            >
              Accept
            </button>
          )}
          {canReject && (
            <button
              onClick={() => setShowReject(true)}
              className="rounded px-4 py-2 text-sm font-medium text-white bg-[#BB0000] hover:bg-red-800 transition-colors"
            >
              Reject
            </button>
          )}
        </div>
      )}

      {/* Reject form */}
      {showReject && (
        <div className="card p-5 border-l-4 border-[#BB0000]">
          <h3 className="text-sm font-semibold text-[#32363A] mb-3">Rejection Reason</h3>
          <textarea
            className="input w-full h-24 resize-none mb-3"
            placeholder="Explain why you are rejecting this document (min 10 characters)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => actionMutation.mutate({ action: 'reject', comment: rejectReason })}
              disabled={rejectReason.length < 10 || actionMutation.isPending}
              className="rounded px-4 py-2 text-sm font-medium text-white bg-[#BB0000] hover:bg-red-800 disabled:opacity-40 transition-colors"
            >
              Confirm Rejection
            </button>
            <button
              onClick={() => { setShowReject(false); setRejectReason(''); }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Document details */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-[#32363A]">Document Details</h2>
        </div>
        <div className="p-5">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
            <Field label="Reference Number" value={doc.referenceNumber} />
            <Field label="Type"             value={typeLabel[doc.type] ?? doc.type} />
            <Field label="Status"           value={<span className={statusBadge[doc.status] ?? 'badge-draft'}>{doc.status}</span>} />
            <Field label="Amount"           value={doc.totalAmount ? `${doc.currency} ${doc.totalAmount.toLocaleString()}` : '—'} />
            <Field label="Currency"         value={doc.currency} />
            <Field label="Due Date"         value={doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '—'} />
            <Field label="Sent At"          value={doc.sentAt ? new Date(doc.sentAt).toLocaleString() : '—'} />
            <Field label="Created"          value={new Date(doc.createdAt).toLocaleString()} />
            <Field label="Last Updated"     value={new Date(doc.updatedAt).toLocaleString()} />
          </dl>
        </div>
      </div>

      {/* Line Items — interactive acknowledgement form when SENT, read-only otherwise */}
      {hasLineItems && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#32363A]">Line Items</h2>
            {canAcknowledge && (
              <span className="text-xs text-[#6A6D70]">Enter confirmed quantities to acknowledge</span>
            )}
            {doc.status === 'ACKNOWLEDGED' && doc.lineAcknowledgements.length > 0 && (
              <span className="text-xs text-[#107E3E] font-medium">Acknowledgement submitted</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#EDEDED] bg-[#F5F6F7]">
                  <th className="text-left text-xs font-medium text-[#6A6D70] px-5 py-3">#</th>
                  <th className="text-left text-xs font-medium text-[#6A6D70] px-5 py-3">SKU</th>
                  <th className="text-left text-xs font-medium text-[#6A6D70] px-5 py-3">Description</th>
                  <th className="text-right text-xs font-medium text-[#6A6D70] px-5 py-3">Ordered Qty</th>
                  <th className="text-right text-xs font-medium text-[#6A6D70] px-5 py-3">Unit Price</th>
                  {canAcknowledge ? (
                    <th className="text-right text-xs font-medium text-[#6A6D70] px-5 py-3">Confirmed Qty</th>
                  ) : (
                    <>
                      <th className="text-right text-xs font-medium text-[#6A6D70] px-5 py-3">Confirmed Qty</th>
                      <th className="text-right text-xs font-medium text-[#6A6D70] px-5 py-3">Line Total</th>
                    </>
                  )}
                  <th className="text-center text-xs font-medium text-[#6A6D70] px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F6F7]">
                {doc.lineItems.map((item) => {
                  if (canAcknowledge) {
                    const ack = lineAcks[item.id] ?? { confirmedQty: item.orderedQty, reason: '' };
                    const status = lineStatus(ack.confirmedQty, item.orderedQty);
                    return (
                      <tr key={item.id} className="hover:bg-[#FAFAFA]">
                        <td className="px-5 py-3.5 text-[#6A6D70]">{item.lineNumber}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-[#32363A]">{item.sku}</td>
                        <td className="px-5 py-3.5 text-[#32363A]">{item.description}</td>
                        <td className="px-5 py-3.5 text-right text-[#32363A]">
                          {item.orderedQty.toLocaleString()} <span className="text-[#6A6D70] text-xs">{item.unit}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-[#32363A]">
                          {doc.currency} {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={item.orderedQty}
                              className="input w-24 text-right text-sm py-1.5"
                              value={ack.confirmedQty}
                              onChange={(e) =>
                                updateLineAck(
                                  item.id,
                                  'confirmedQty',
                                  Math.max(0, Math.min(item.orderedQty, Number(e.target.value))),
                                )
                              }
                            />
                            <span className="text-[#6A6D70] text-xs w-8">{item.unit}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={statusBadge[status] ?? 'badge-draft'}>{status}</span>
                        </td>
                      </tr>
                    );
                  }

                  // Read-only view
                  const ackRecord = doc.lineAcknowledgements.find((a) => a.lineItemId === item.id);
                  const confirmedQty = ackRecord?.confirmedQty ?? item.orderedQty;
                  const status       = ackRecord?.status ?? 'PENDING';
                  const lineTotal    = confirmedQty * item.unitPrice;
                  return (
                    <tr key={item.id} className="hover:bg-[#FAFAFA]">
                      <td className="px-5 py-3.5 text-[#6A6D70]">{item.lineNumber}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[#32363A]">{item.sku}</td>
                      <td className="px-5 py-3.5 text-[#32363A]">{item.description}</td>
                      <td className="px-5 py-3.5 text-right text-[#32363A]">
                        {item.orderedQty.toLocaleString()} <span className="text-[#6A6D70] text-xs">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[#32363A]">
                        {doc.currency} {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-[#32363A]">
                        {confirmedQty.toLocaleString()} <span className="text-[#6A6D70] text-xs">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-[#32363A]">
                        {doc.currency} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={statusBadge[status] ?? 'badge-draft'}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Acknowledgement form footer */}
          {canAcknowledge && (
            <div className="p-5 border-t border-[#EDEDED] space-y-4">
              {/* Reason inputs for partial / rejected lines */}
              {linesNeedingReason.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#6A6D70]">
                    Provide a reason for lines with reduced or zero quantity:
                  </p>
                  {linesNeedingReason.map((item) => {
                    const ack = lineAcks[item.id] ?? { confirmedQty: 0, reason: '' };
                    const status = lineStatus(ack.confirmedQty, item.orderedQty);
                    return (
                      <div key={item.id} className="flex gap-3 items-center">
                        <span className="text-xs font-mono text-[#32363A] w-28 flex-shrink-0">{item.sku}</span>
                        <span className={`${statusBadge[status]} text-xs flex-shrink-0`}>{status}</span>
                        <input
                          type="text"
                          className="input text-xs flex-1 py-1.5"
                          placeholder={`Reason for ${status === 'REJECTED' ? 'rejection' : 'partial quantity'}...`}
                          value={ack.reason}
                          onChange={(e) => updateLineAck(item.id, 'reason', e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary + submit */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#6A6D70] space-y-0.5">
                  <div>
                    <span className="font-medium text-[#32363A]">
                      {Object.values(lineAcks).filter((a) => a.confirmedQty > 0).length}
                    </span>
                    {' '}of {doc.lineItems.length} lines confirmed
                  </div>
                  <div>
                    Confirmed value:{' '}
                    <span className="font-medium text-[#32363A]">
                      {doc.currency}{' '}
                      {confirmedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canReject && (
                    <button
                      onClick={() => setShowReject(true)}
                      className="rounded px-4 py-2 text-sm font-medium text-white bg-[#BB0000] hover:bg-red-800 transition-colors"
                    >
                      Reject Document
                    </button>
                  )}
                  <button
                    onClick={handleAcknowledge}
                    disabled={actionMutation.isPending}
                    className="rounded px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#107E3E' }}
                  >
                    {actionMutation.isPending ? 'Submitting…' : 'Submit Acknowledgement'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parties */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-[#32363A]">Sender</h2>
          </div>
          <div className="p-5">
            <dl className="space-y-3">
              <Field label="Company"   value={doc.sender?.name ?? doc.senderTenantId} />
              <Field label="Country"   value={doc.sender?.country} />
              <Field label="Tenant ID" value={doc.senderTenantId} />
            </dl>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-[#32363A]">Receiver</h2>
          </div>
          <div className="p-5">
            <dl className="space-y-3">
              <Field label="Company"   value={doc.receiver?.name ?? doc.receiverTenantId} />
              <Field label="Country"   value={doc.receiver?.country} />
              <Field label="Tenant ID" value={doc.receiverTenantId} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
