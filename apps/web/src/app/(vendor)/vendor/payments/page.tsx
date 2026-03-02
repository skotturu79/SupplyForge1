'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────
type PayStatus = 'SCHEDULED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED';
type PayMethod = 'WIRE' | 'ACH' | 'SEPA' | 'SWIFT' | 'CHEQUE';

interface Payment {
  id: string; invoiceReference: string; poReference: string;
  amount: number; currency: string; status: PayStatus;
  paymentMethod: PayMethod; paymentReference: string; bankReference: string;
  scheduledDate: string; paidAt: string | null;
  remittanceNote: string; earlyPayDiscount: number;
}

interface Summary { totalPaid: number; totalScheduled: number; totalProcessing: number }

// ── Helpers ───────────────────────────────────────────────────────
const STATUS_CFG: Record<PayStatus, { label: string; cls: string; dot: string }> = {
  PAID:        { label: 'Paid',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  SCHEDULED:   { label: 'Scheduled',   cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-400'    },
  PROCESSING:  { label: 'Processing',  cls: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-500'   },
  FAILED:      { label: 'Failed',      cls: 'bg-red-50 text-red-600 border-red-200',            dot: 'bg-red-500'     },
  REVERSED:    { label: 'Reversed',    cls: 'bg-gray-100 text-gray-500 border-gray-200',        dot: 'bg-gray-400'    },
};

const METHOD_ICON: Record<PayMethod, string> = {
  WIRE: '🏦', ACH: '🏛', SEPA: '🇪🇺', SWIFT: '🌐', CHEQUE: '📄',
};

const TABS = [
  { label: 'All',        value: '' },
  { label: 'Paid',       value: 'PAID' },
  { label: 'Scheduled',  value: 'SCHEDULED' },
  { label: 'Processing', value: 'PROCESSING' },
];

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}
function fmtFull(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [tab, setTab] = useState('');
  const [detail, setDetail] = useState<Payment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-payments'],
    queryFn: () => apiClient.get('/vendor/payments').then((r) => r.data),
  });

  const payments: Payment[]     = data?.data    ?? [];
  const summary:  Summary | undefined = data?.summary;
  const filtered = tab ? payments.filter((p) => p.status === tab) : payments;

  // Stats
  const discountTotal = payments.reduce((s, p) => s + (p.earlyPayDiscount ?? 0), 0);
  const processingCount = payments.filter((p) => p.status === 'PROCESSING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#32363A]">Payment History</h1>
        <p className="text-sm text-[#6A6D70] mt-1">Remittance advice, payment schedules and early-pay discounts</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card accent-green p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Total Paid</p>
          <p className="text-2xl font-bold text-[#107E3E] mt-1">{summary ? fmt(summary.totalPaid) : '—'}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">{payments.filter((p) => p.status === 'PAID').length} transactions</p>
        </div>
        <div className="stat-card accent-blue p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Scheduled</p>
          <p className="text-2xl font-bold text-[#0070F2] mt-1">{summary ? fmt(summary.totalScheduled) : '—'}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Upcoming payments</p>
        </div>
        <div className={`stat-card p-5 ${processingCount > 0 ? 'accent-amber' : 'accent-teal'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">In Processing</p>
          <p className={`text-2xl font-bold mt-1 ${processingCount > 0 ? 'text-amber-600' : 'text-teal-700'}`}>
            {summary ? fmt(summary.totalProcessing) : '—'}
          </p>
          <p className="text-xs text-[#9EA1A4] mt-1">Being transferred</p>
        </div>
        <div className="stat-card accent-purple p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Early Pay Savings</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{fmtFull(discountTotal)}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Discount captured</p>
        </div>
      </div>

      {/* Upcoming notice */}
      {summary && summary.totalScheduled > 0 && (
        <div className="attn-info">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          <span><strong>{fmt(summary.totalScheduled)}</strong> in scheduled payments — funds will be transferred on due date</span>
        </div>
      )}

      {/* Tabs + table */}
      <div className="card-hero">
        <div className="px-5 pt-4 pb-0 border-b border-[#EDEDED] flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.value ? 'border-[#0070F2] text-[#0070F2]' : 'border-transparent text-[#6A6D70] hover:text-[#32363A]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-[#9EA1A4] py-10">No payments in this category</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EDEDED]">
                    {['Payment Ref', 'Invoice / PO', 'Method', 'Amount', 'Date', 'Status', ''].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#9EA1A4]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F6F7]">
                  {filtered.map((p) => {
                    const s = STATUS_CFG[p.status];
                    const date = p.paidAt ?? p.scheduledDate;
                    return (
                      <tr key={p.id} className="hover:bg-[#F5F6F7]/70 transition-colors group">
                        <td className="px-3 py-3">
                          <p className="font-mono text-xs font-semibold text-[#32363A]">{p.paymentReference}</p>
                          {p.bankReference && <p className="text-[10px] text-[#9EA1A4] mt-0.5">{p.bankReference}</p>}
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-xs font-medium text-[#32363A]">{p.invoiceReference}</p>
                          <p className="text-[10px] text-[#9EA1A4]">{p.poReference}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1.5 text-xs text-[#6A6D70]">
                            <span>{METHOD_ICON[p.paymentMethod]}</span>
                            <span>{p.paymentMethod}</span>
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-bold text-[#32363A]">{fmtFull(p.amount, p.currency)}</p>
                          {p.earlyPayDiscount > 0 && (
                            <p className="text-[10px] text-emerald-700 font-semibold">−{fmtFull(p.earlyPayDiscount)} discount</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-[#6A6D70]">{fmtDate(date)}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => setDetail(p)}
                            className="text-xs text-[#0070F2] hover:underline opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail slide-over */}
      {detail && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setDetail(null)}>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#EDEDED] flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#354A5E,#2A3D52)' }}>
              <div>
                <h2 className="text-base font-bold text-white">Remittance Advice</h2>
                <p className="text-xs text-white/60 mt-0.5">{detail.paymentReference}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-white/60 hover:text-white">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Amount hero */}
              <div className="text-center py-4 bg-[#F5F6F7] rounded-xl">
                <p className="text-3xl font-extrabold text-[#32363A]">{fmtFull(detail.amount, detail.currency)}</p>
                {detail.earlyPayDiscount > 0 && (
                  <p className="text-sm text-emerald-700 font-semibold mt-1">
                    Early pay discount applied: −{fmtFull(detail.earlyPayDiscount, detail.currency)}
                  </p>
                )}
                <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_CFG[detail.status].cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[detail.status].dot}`} />
                  {STATUS_CFG[detail.status].label}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Invoice', detail.invoiceReference],
                  ['PO Reference', detail.poReference],
                  ['Payment Method', `${METHOD_ICON[detail.paymentMethod]} ${detail.paymentMethod}`],
                  ['Bank Reference', detail.bankReference || '—'],
                  ['Scheduled Date', fmtDate(detail.scheduledDate)],
                  ['Paid At', detail.paidAt ? fmtDate(detail.paidAt) : '—'],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-[10px] uppercase tracking-wide text-[#9EA1A4] font-semibold">{label}</dt>
                    <dd className="text-[#32363A] font-medium mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="bg-[#F5F6F7] rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wide text-[#9EA1A4] font-semibold mb-1">Remittance Note</p>
                <p className="text-sm text-[#6A6D70]">{detail.remittanceNote || '—'}</p>
              </div>

              {/* Secure note */}
              <div className="flex items-start gap-3 border border-emerald-200 rounded-xl p-3 bg-emerald-50">
                <svg className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <p className="text-xs text-emerald-800">Payment details are transmitted over TLS 1.3 and stored with AES-256-GCM encryption.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
