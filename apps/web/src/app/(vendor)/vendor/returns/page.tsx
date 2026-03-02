'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────
type RmaStatus = 'REQUESTED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CLOSED' | 'REJECTED';
type RmaReason = 'DEFECTIVE' | 'WRONG_ITEM' | 'DAMAGED_IN_TRANSIT' | 'OVERSHIPMENT' | 'QUALITY_ISSUE' | 'OTHER';

interface RmaItem { sku: string; description: string; qty: number; unitPrice: number; currency: string }
interface Rma {
  id: string; rmaNumber: string; poReference: string; invoiceReference: string;
  reason: RmaReason; status: RmaStatus;
  items: RmaItem[];
  creditNoteNumber: string | null; creditNoteAmount: number | null;
  notes: string; requestedAt: string; updatedAt: string; closedAt: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────
const STATUS_CFG: Record<RmaStatus, { label: string; cls: string; step: number }> = {
  REQUESTED:   { label: 'Requested',   cls: 'bg-blue-50 text-blue-700 border-blue-200',   step: 0 },
  APPROVED:    { label: 'Approved',    cls: 'bg-purple-50 text-purple-700 border-purple-200', step: 1 },
  IN_TRANSIT:  { label: 'In Transit',  cls: 'bg-amber-50 text-amber-700 border-amber-200', step: 2 },
  RECEIVED:    { label: 'Received',    cls: 'bg-teal-50 text-teal-700 border-teal-200',   step: 3 },
  CLOSED:      { label: 'Closed',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', step: 4 },
  REJECTED:    { label: 'Rejected',    cls: 'bg-red-50 text-red-600 border-red-200',      step: -1 },
};

const REASON_LABEL: Record<RmaReason, string> = {
  DEFECTIVE:          'Defective / Faulty',
  WRONG_ITEM:         'Wrong Item Shipped',
  DAMAGED_IN_TRANSIT: 'Damaged in Transit',
  OVERSHIPMENT:       'Overshipment',
  QUALITY_ISSUE:      'Quality Issue',
  OTHER:              'Other',
};

const TABS: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Requested', value: 'REQUESTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'In Transit', value: 'IN_TRANSIT' },
  { label: 'Received', value: 'RECEIVED' },
  { label: 'Closed', value: 'CLOSED' },
];

const NEXT_STATUS: Partial<Record<RmaStatus, RmaStatus>> = {
  REQUESTED:  'APPROVED',
  APPROVED:   'IN_TRANSIT',
  IN_TRANSIT: 'RECEIVED',
  RECEIVED:   'CLOSED',
};

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
}

const PIPELINE_STEPS = ['Requested', 'Approved', 'In Transit', 'Received', 'Closed'];

// ── Component ─────────────────────────────────────────────────────
export default function ReturnsPage() {
  const qc = useQueryClient();
  const [tab,     setTab]     = useState('');
  const [detail,  setDetail]  = useState<Rma | null>(null);
  const [cnModal, setCnModal] = useState<Rma | null>(null);
  const [cnForm,  setCnForm]  = useState({ creditNoteNumber: '', creditNoteAmount: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-returns'],
    queryFn: () => apiClient.get('/vendor/returns').then((r) => r.data),
  });

  const returns: Rma[] = data?.data ?? [];
  const filtered = tab ? returns.filter((r) => r.status === tab) : returns;

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RmaStatus }) =>
      apiClient.patch(`/vendor/returns/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-returns'] }),
  });

  const issueCn = useMutation({
    mutationFn: ({ id, ...body }: { id: string; creditNoteNumber: string; creditNoteAmount: number }) =>
      apiClient.patch(`/vendor/returns/${id}`, { ...body, status: 'CLOSED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-returns'] }); setCnModal(null); },
  });

  // Summary
  const open     = returns.filter((r) => !['CLOSED', 'REJECTED'].includes(r.status)).length;
  const pending  = returns.filter((r) => r.status === 'REQUESTED').length;
  const creditTotal = returns.filter((r) => r.creditNoteAmount).reduce((s, r) => s + (r.creditNoteAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#32363A]">Returns & RMA</h1>
          <p className="text-sm text-[#6A6D70] mt-1">Manage return merchandise authorisations and credit notes</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card accent-blue p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Open RMAs</p>
          <p className="text-3xl font-bold text-[#0070F2] mt-1">{open}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">In progress</p>
        </div>
        <div className={`stat-card p-5 ${pending > 0 ? 'accent-amber' : 'accent-green'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Awaiting Approval</p>
          <p className={`text-3xl font-bold mt-1 ${pending > 0 ? 'text-amber-600' : 'text-[#107E3E]'}`}>{pending}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Needs action</p>
        </div>
        <div className="stat-card accent-green p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Credit Issued</p>
          <p className="text-3xl font-bold text-[#107E3E] mt-1">{fmt(creditTotal)}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Total value</p>
        </div>
        <div className="stat-card accent-purple p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Total RMAs</p>
          <p className="text-3xl font-bold text-purple-700 mt-1">{returns.length}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">All time</p>
        </div>
      </div>

      {/* Attention strip for pending */}
      {pending > 0 && (
        <div className="attn-warn">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span><strong>{pending} return request{pending > 1 ? 's' : ''}</strong> awaiting your approval</span>
        </div>
      )}

      {/* Tabs + list */}
      <div className="card-hero">
        <div className="px-5 pt-4 pb-0 border-b border-[#EDEDED] flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.value ? 'border-[#0070F2] text-[#0070F2]' : 'border-transparent text-[#6A6D70] hover:text-[#32363A]'}`}>
              {t.label}
              {t.value === 'REQUESTED' && pending > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 rounded-full text-[10px] font-bold text-white">{pending}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-[#9EA1A4] py-10">No returns in this category</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((rma) => {
                const s    = STATUS_CFG[rma.status];
                const next = NEXT_STATUS[rma.status];
                const totalVal = rma.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
                const cur      = rma.items[0]?.currency ?? 'USD';
                return (
                  <div key={rma.id} className="border border-[#EDEDED] rounded-xl overflow-hidden hover:border-[#C8CAD0] transition-colors">
                    <div className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-[#32363A]">{rma.rmaNumber}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>{s.label}</span>
                          <span className="px-2 py-0.5 bg-[#F0F2F4] rounded-full text-[11px] text-[#6A6D70] font-medium">{REASON_LABEL[rma.reason]}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-[#9EA1A4]">
                          <span>PO: <span className="text-[#6A6D70] font-medium">{rma.poReference}</span></span>
                          <span>Inv: <span className="text-[#6A6D70] font-medium">{rma.invoiceReference}</span></span>
                          <span>Requested {new Date(rma.requestedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-[#6A6D70] mt-1 line-clamp-1">{rma.notes}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-base font-bold text-[#32363A]">{fmt(totalVal, cur)}</p>
                        <p className="text-xs text-[#9EA1A4]">{rma.items.reduce((s, i) => s + i.qty, 0)} units</p>
                        {rma.creditNoteNumber && (
                          <p className="text-xs text-emerald-700 font-semibold mt-1">CN: {rma.creditNoteNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Pipeline progress */}
                    {rma.status !== 'REJECTED' && (
                      <div className="px-4 pb-3">
                        <div className="flex items-center gap-1">
                          {PIPELINE_STEPS.map((step, i) => {
                            const done = i < STATUS_CFG[rma.status].step;
                            const curr = i === STATUS_CFG[rma.status].step;
                            return (
                              <div key={step} className="flex items-center gap-1 flex-1">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${done || curr ? 'bg-[#107E3E]' : 'bg-[#EDEDED]'}`} />
                                <div className={`flex-1 h-0.5 ${i < PIPELINE_STEPS.length - 1 ? (done ? 'bg-[#107E3E]' : 'bg-[#EDEDED]') : 'hidden'}`} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action row */}
                    <div className="px-4 py-3 bg-[#F5F6F7] border-t border-[#EDEDED] flex items-center justify-between gap-3">
                      <button onClick={() => setDetail(rma)}
                        className="text-xs text-[#0070F2] hover:underline font-semibold">
                        View details →
                      </button>
                      <div className="flex items-center gap-2">
                        {rma.status === 'RECEIVED' && !rma.creditNoteNumber && (
                          <button onClick={() => { setCnModal(rma); setCnForm({ creditNoteNumber: '', creditNoteAmount: '' }); }}
                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors">
                            Issue Credit Note
                          </button>
                        )}
                        {next && rma.status !== 'RECEIVED' && (
                          <button onClick={() => advance.mutate({ id: rma.id, status: next })}
                            disabled={advance.isPending}
                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#107E3E,#0A5C2C)' }}>
                            Mark {STATUS_CFG[next].label}
                          </button>
                        )}
                        {rma.status === 'REQUESTED' && (
                          <button onClick={() => advance.mutate({ id: rma.id, status: 'REJECTED' })}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail slide-over */}
      {detail && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setDetail(null)}>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" />
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#EDEDED] flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#354A5E,#2A3D52)' }}>
              <div>
                <h2 className="text-base font-bold text-white">{detail.rmaNumber}</h2>
                <p className="text-xs text-white/60 mt-0.5">{REASON_LABEL[detail.reason]}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-white/60 hover:text-white">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Status', <span key="s" className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_CFG[detail.status].cls}`}>{STATUS_CFG[detail.status].label}</span>],
                  ['PO Reference',      detail.poReference],
                  ['Invoice Reference', detail.invoiceReference],
                  ['Requested',         new Date(detail.requestedAt).toLocaleDateString()],
                  ['Credit Note',       detail.creditNoteNumber ?? '—'],
                  ['Credit Amount',     detail.creditNoteAmount ? fmt(detail.creditNoteAmount) : '—'],
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <p className="text-[10px] uppercase tracking-wide text-[#9EA1A4] font-semibold">{label}</p>
                    <p className="text-[#32363A] font-medium mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6A6D70] mb-2">Return Items</p>
                <div className="border border-[#EDEDED] rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F5F6F7]">
                      <tr>{['SKU', 'Description', 'Qty', 'Value'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-[#9EA1A4] uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F6F7]">
                      {detail.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2.5 font-mono text-[#6A6D70]">{item.sku}</td>
                          <td className="px-3 py-2.5 text-[#32363A]">{item.description}</td>
                          <td className="px-3 py-2.5 text-[#6A6D70]">{item.qty}</td>
                          <td className="px-3 py-2.5 font-semibold">{fmt(item.qty * item.unitPrice, item.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {detail.notes && (
                <div className="bg-[#F5F6F7] rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wide text-[#9EA1A4] font-semibold mb-1">Notes</p>
                  <p className="text-sm text-[#6A6D70]">{detail.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credit note modal */}
      {cnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-[#EDEDED]"
              style={{ background: 'linear-gradient(135deg,#354A5E,#2A3D52)' }}>
              <h2 className="text-base font-bold text-white">Issue Credit Note</h2>
              <p className="text-xs text-white/60 mt-0.5">{cnModal.rmaNumber}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Credit Note Number *</label>
                <input value={cnForm.creditNoteNumber}
                  onChange={(e) => setCnForm((f) => ({ ...f, creditNoteNumber: e.target.value }))}
                  placeholder="CN-2026-XXXX"
                  className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Credit Amount *</label>
                <input type="number" min="0" step="0.01" value={cnForm.creditNoteAmount}
                  onChange={(e) => setCnForm((f) => ({ ...f, creditNoteAmount: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#EDEDED] flex justify-end gap-3">
              <button onClick={() => setCnModal(null)} className="px-4 py-2 text-sm font-semibold text-[#6A6D70] bg-[#F0F2F4] rounded-lg">Cancel</button>
              <button
                onClick={() => issueCn.mutate({ id: cnModal.id, creditNoteNumber: cnForm.creditNoteNumber, creditNoteAmount: parseFloat(cnForm.creditNoteAmount) })}
                disabled={issueCn.isPending || !cnForm.creditNoteNumber || !cnForm.creditNoteAmount}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                {issueCn.isPending ? 'Issuing…' : 'Issue Credit Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
