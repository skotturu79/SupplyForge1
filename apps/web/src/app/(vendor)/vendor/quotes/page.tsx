'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────
type QuoteStatus = 'RFQ_RECEIVED' | 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

interface QuoteItem {
  sku: string; description: string; qty: number;
  requestedPrice: number | null; quotedPrice: number | null;
  currency: string; leadTimeDays: number | null;
}

interface Quote {
  id: string; quoteNumber: string; rfqReference: string; subject: string;
  status: QuoteStatus; items: QuoteItem[];
  validUntil: string | null; deliveryTerms: string; paymentTerms: string;
  notes: string; receivedAt: string; submittedAt: string | null; updatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────
const STATUS_CFG: Record<QuoteStatus, { label: string; cls: string }> = {
  RFQ_RECEIVED: { label: 'RFQ Received', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  DRAFT:        { label: 'Draft',        cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  SUBMITTED:    { label: 'Submitted',    cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  ACCEPTED:     { label: 'Accepted',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:     { label: 'Rejected',     cls: 'bg-red-50 text-red-600 border-red-200' },
  EXPIRED:      { label: 'Expired',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const INCOTERMS = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
const PAY_TERMS = ['Net-15', 'Net-30', 'Net-45', 'Net-60', 'Net-90', '2/10 Net-30', 'CIA', 'COD'];

const TABS = [
  { label: 'All',          value: '' },
  { label: 'New RFQs',     value: 'RFQ_RECEIVED' },
  { label: 'Draft',        value: 'DRAFT' },
  { label: 'Submitted',    value: 'SUBMITTED' },
  { label: 'Accepted',     value: 'ACCEPTED' },
  { label: 'Expired',      value: 'EXPIRED' },
];

function fmt(n: number, cur = 'EUR') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────
export default function QuotesPage() {
  const qc = useQueryClient();
  const [tab,    setTab]    = useState('');
  const [detail, setDetail] = useState<Quote | null>(null);
  // Edit form state (for quotes being drafted/edited)
  const [editForm, setEditForm] = useState<{
    items: Array<QuoteItem & { _quotedPrice: string; _leadTimeDays: string }>;
    validUntil: string; deliveryTerms: string; paymentTerms: string; notes: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-quotes'],
    queryFn: () => apiClient.get('/vendor/quotes').then((r) => r.data),
  });

  const quotes: Quote[] = data?.data ?? [];
  const filtered = tab ? quotes.filter((q) => q.status === tab) : quotes;

  const newRfqs    = quotes.filter((q) => q.status === 'RFQ_RECEIVED').length;
  const submitted  = quotes.filter((q) => q.status === 'SUBMITTED').length;
  const accepted   = quotes.filter((q) => q.status === 'ACCEPTED').length;
  const totalValue = quotes
    .filter((q) => ['SUBMITTED', 'ACCEPTED'].includes(q.status))
    .reduce((sum, q) => sum + q.items.reduce((s, i) => s + i.qty * (i.quotedPrice ?? 0), 0), 0);

  const saveQuote = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<Quote>) =>
      apiClient.patch(`/vendor/quotes/${id}`, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['vendor-quotes'] });
      // refresh detail if open
      if (detail?.id === vars.id) {
        setDetail((d) => d ? { ...d, ...vars } : null);
      }
      setEditForm(null);
    },
  });

  const submitQuote = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/vendor/quotes/${id}`, { status: 'SUBMITTED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-quotes'] }); setDetail(null); setEditForm(null); },
  });

  const openEdit = (q: Quote) => {
    setDetail(q);
    setEditForm({
      items: q.items.map((i) => ({
        ...i,
        _quotedPrice:   String(i.quotedPrice   ?? ''),
        _leadTimeDays:  String(i.leadTimeDays   ?? ''),
      })),
      validUntil:    q.validUntil?.slice(0, 10) ?? '',
      deliveryTerms: q.deliveryTerms,
      paymentTerms:  q.paymentTerms,
      notes:         q.notes,
    });
  };

  const saveAndClose = (q: Quote) => {
    if (!editForm) return;
    const items: QuoteItem[] = editForm.items.map((i) => ({
      sku:            i.sku,
      description:    i.description,
      qty:            i.qty,
      requestedPrice: i.requestedPrice,
      quotedPrice:    parseFloat(i._quotedPrice) || null,
      currency:       i.currency,
      leadTimeDays:   parseInt(i._leadTimeDays) || null,
    }));
    saveQuote.mutate({
      id: q.id,
      items,
      validUntil:    editForm.validUntil ? editForm.validUntil + 'T00:00:00Z' : null,
      deliveryTerms: editForm.deliveryTerms,
      paymentTerms:  editForm.paymentTerms,
      notes:         editForm.notes,
      status:        'DRAFT',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#32363A]">Quotes & RFQ Responses</h1>
        <p className="text-sm text-[#6A6D70] mt-1">Respond to buyer requests for quotation and manage active quotes</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`stat-card p-5 ${newRfqs > 0 ? 'accent-blue' : 'accent-green'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">New RFQs</p>
          <p className={`text-3xl font-bold mt-1 ${newRfqs > 0 ? 'text-[#0070F2]' : 'text-[#107E3E]'}`}>{newRfqs}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Awaiting response</p>
        </div>
        <div className="stat-card accent-purple p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Submitted</p>
          <p className="text-3xl font-bold text-purple-700 mt-1">{submitted}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Pending buyer decision</p>
        </div>
        <div className="stat-card accent-green p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Accepted</p>
          <p className="text-3xl font-bold text-[#107E3E] mt-1">{accepted}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Won quotes</p>
        </div>
        <div className="stat-card accent-teal p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Quote Pipeline</p>
          <p className="text-2xl font-bold text-teal-700 mt-1">{fmt(totalValue)}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Submitted + accepted</p>
        </div>
      </div>

      {/* New RFQ alert */}
      {newRfqs > 0 && (
        <div className="attn-info">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          <span><strong>{newRfqs} new RFQ{newRfqs > 1 ? 's' : ''}</strong> received from buyers — respond promptly to maintain your responsiveness score</span>
        </div>
      )}

      {/* Tabs + list */}
      <div className="card-hero">
        <div className="px-5 pt-4 pb-0 border-b border-[#EDEDED] flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.value ? 'border-[#0070F2] text-[#0070F2]' : 'border-transparent text-[#6A6D70] hover:text-[#32363A]'}`}>
              {t.label}
              {t.value === 'RFQ_RECEIVED' && newRfqs > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500 rounded-full text-[10px] font-bold text-white">{newRfqs}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-[#9EA1A4] py-10">No quotes in this category</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((q) => {
                const s         = STATUS_CFG[q.status];
                const quoteVal  = q.items.reduce((sum, i) => sum + i.qty * (i.quotedPrice ?? i.requestedPrice ?? 0), 0);
                const cur       = q.items[0]?.currency ?? 'EUR';
                const isNew     = q.status === 'RFQ_RECEIVED';
                return (
                  <div key={q.id} className={`border rounded-xl overflow-hidden transition-colors ${isNew ? 'border-[#0070F2]/30 bg-blue-50/30' : 'border-[#EDEDED] hover:border-[#C8CAD0]'}`}>
                    <div className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {q.quoteNumber && <span className="font-mono text-sm font-bold text-[#32363A]">{q.quoteNumber}</span>}
                          {isNew && <span className="live-dot-blue" />}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>{s.label}</span>
                          <span className="text-[11px] text-[#9EA1A4]">RFQ: {q.rfqReference}</span>
                        </div>
                        <p className="text-sm font-semibold text-[#32363A] mt-1">{q.subject}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#9EA1A4]">
                          <span>{q.items.length} line item{q.items.length > 1 ? 's' : ''}</span>
                          {q.deliveryTerms && <span>· {q.deliveryTerms}</span>}
                          {q.validUntil && <span>· Valid until {fmtDate(q.validUntil)}</span>}
                          <span>· Received {fmtDate(q.receivedAt)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-base font-bold text-[#32363A]">{quoteVal > 0 ? fmt(quoteVal, cur) : '—'}</p>
                        <p className="text-xs text-[#9EA1A4]">Quote value</p>
                      </div>
                    </div>

                    {/* Line items preview */}
                    <div className="px-4 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {q.items.map((item, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#EDEDED] rounded-lg text-[11px] text-[#6A6D70]">
                            <span className="font-mono font-semibold text-[#32363A]">{item.sku}</span>
                            <span>×{item.qty}</span>
                            {item.quotedPrice && <span className="text-emerald-700 font-semibold">{fmt(item.quotedPrice, item.currency)}</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-[#F5F6F7] border-t border-[#EDEDED] flex items-center justify-between">
                      <button onClick={() => setDetail(q)}
                        className="text-xs text-[#0070F2] hover:underline font-semibold">View details →</button>
                      <div className="flex items-center gap-2">
                        {(isNew || q.status === 'DRAFT') && (
                          <button onClick={() => openEdit(q)}
                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#354A5E,#2A3D52)' }}>
                            {isNew ? 'Prepare Quote' : 'Edit Quote'}
                          </button>
                        )}
                        {q.status === 'DRAFT' && (
                          <button onClick={() => submitQuote.mutate(q.id)}
                            disabled={submitQuote.isPending}
                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50 hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#107E3E,#0A5C2C)' }}>
                            Submit Quote
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

      {/* Detail / Edit panel */}
      {detail && (
        <div className="fixed inset-0 z-50 flex" onClick={() => { setDetail(null); setEditForm(null); }}>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" />
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#EDEDED] flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#354A5E,#2A3D52)' }}>
              <div>
                <h2 className="text-base font-bold text-white">{detail.quoteNumber || detail.rfqReference}</h2>
                <p className="text-xs text-white/60 mt-0.5">{detail.subject}</p>
              </div>
              <button onClick={() => { setDetail(null); setEditForm(null); }} className="text-white/60 hover:text-white">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status + dates */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CFG[detail.status].cls}`}>
                  {STATUS_CFG[detail.status].label}
                </span>
                <div className="text-xs text-[#9EA1A4]">
                  Received {fmtDate(detail.receivedAt)}
                  {detail.submittedAt && <> · Submitted {fmtDate(detail.submittedAt)}</>}
                </div>
              </div>

              {/* Line items table */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6A6D70] mb-2">Line Items</p>
                <div className="border border-[#EDEDED] rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F5F6F7]">
                      <tr>
                        {['SKU', 'Description', 'Qty', 'Req. Price', editForm ? 'Your Price *' : 'Quoted Price', 'Lead Time'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-[#9EA1A4] uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F6F7]">
                      {(editForm ? editForm.items : detail.items).map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2.5 font-mono text-[#6A6D70]">{item.sku}</td>
                          <td className="px-3 py-2.5 text-[#32363A]">{item.description}</td>
                          <td className="px-3 py-2.5 text-[#6A6D70]">{item.qty}</td>
                          <td className="px-3 py-2.5 text-[#9EA1A4]">
                            {item.requestedPrice ? fmt(item.requestedPrice, item.currency) : '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            {editForm ? (
                              <input
                                type="number" min="0" step="0.01"
                                value={(editForm.items[i] as typeof editForm.items[0])._quotedPrice}
                                onChange={(e) => setEditForm((f) => {
                                  if (!f) return f;
                                  const items = [...f.items];
                                  items[i] = { ...items[i], _quotedPrice: e.target.value };
                                  return { ...f, items };
                                })}
                                className="w-24 px-2 py-1 text-xs border border-[#EDEDED] rounded focus:outline-none focus:ring-1 focus:ring-[#0070F2]/40"
                              />
                            ) : (
                              <span className="font-semibold text-emerald-700">
                                {item.quotedPrice ? fmt(item.quotedPrice, item.currency) : '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {editForm ? (
                              <input
                                type="number" min="1"
                                value={(editForm.items[i] as typeof editForm.items[0])._leadTimeDays}
                                onChange={(e) => setEditForm((f) => {
                                  if (!f) return f;
                                  const items = [...f.items];
                                  items[i] = { ...items[i], _leadTimeDays: e.target.value };
                                  return { ...f, items };
                                })}
                                placeholder="days"
                                className="w-16 px-2 py-1 text-xs border border-[#EDEDED] rounded focus:outline-none focus:ring-1 focus:ring-[#0070F2]/40"
                              />
                            ) : (
                              <span className="text-[#6A6D70]">{item.leadTimeDays ? `${item.leadTimeDays}d` : '—'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms */}
              {editForm ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-[#9EA1A4] mb-1">Valid Until</label>
                      <input type="date" value={editForm.validUntil}
                        onChange={(e) => setEditForm((f) => f ? { ...f, validUntil: e.target.value } : f)}
                        className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-[#9EA1A4] mb-1">Payment Terms</label>
                      <select value={editForm.paymentTerms}
                        onChange={(e) => setEditForm((f) => f ? { ...f, paymentTerms: e.target.value } : f)}
                        className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30">
                        <option value="">Select…</option>
                        {PAY_TERMS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-[#9EA1A4] mb-1">Delivery Terms (Incoterm)</label>
                    <select value={editForm.deliveryTerms}
                      onChange={(e) => setEditForm((f) => f ? { ...f, deliveryTerms: e.target.value } : f)}
                      className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30">
                      <option value="">Select…</option>
                      {INCOTERMS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-[#9EA1A4] mb-1">Notes / Conditions</label>
                    <textarea value={editForm.notes} rows={3}
                      onChange={(e) => setEditForm((f) => f ? { ...f, notes: e.target.value } : f)}
                      className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30 resize-none" />
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ['RFQ Reference', detail.rfqReference],
                    ['Valid Until', fmtDate(detail.validUntil)],
                    ['Delivery Terms', detail.deliveryTerms || '—'],
                    ['Payment Terms', detail.paymentTerms || '—'],
                  ].map(([k, v]) => (
                    <div key={String(k)}>
                      <dt className="text-[10px] uppercase tracking-wide text-[#9EA1A4] font-semibold">{k}</dt>
                      <dd className="text-[#32363A] font-medium mt-0.5">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {(detail.notes || editForm) && !editForm && (
                <div className="bg-[#F5F6F7] rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wide text-[#9EA1A4] font-semibold mb-1">Notes</p>
                  <p className="text-sm text-[#6A6D70]">{detail.notes || '—'}</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            {editForm && (
              <div className="px-6 py-4 border-t border-[#EDEDED] flex items-center justify-between gap-3">
                <button onClick={() => setEditForm(null)}
                  className="px-4 py-2 text-sm font-semibold text-[#6A6D70] bg-[#F0F2F4] rounded-lg hover:bg-[#E8EAF0]">Cancel</button>
                <div className="flex gap-2">
                  <button onClick={() => saveAndClose(detail)} disabled={saveQuote.isPending}
                    className="px-4 py-2 text-sm font-semibold text-[#32363A] border border-[#EDEDED] bg-white rounded-lg hover:bg-[#F5F6F7] disabled:opacity-50">
                    {saveQuote.isPending ? 'Saving…' : 'Save Draft'}
                  </button>
                  <button
                    onClick={() => {
                      saveAndClose(detail);
                      // Submit after save (handled via side effect if needed)
                    }}
                    disabled={saveQuote.isPending}
                    className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#107E3E,#0A5C2C)' }}>
                    Save & Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
