'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface InvoiceDoc {
  id: string;
  referenceNumber: string;
  type: string;
  status: string;
  totalAmount?: number;
  currency: string;
  dueDate?: string;
  createdAt: string;
  senderTenantId: string;
  receiverTenantId: string;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge-draft', SENT: 'badge-sent',
  PAID: 'badge-paid', DISPUTED: 'badge-acknowledged',
  CANCELLED: 'badge-cancelled', REJECTED: 'badge-rejected',
};

const STATUS_FILTERS = ['', 'DRAFT', 'SENT', 'PAID', 'DISPUTED'];

function daysUntilDue(dueDate: string): number {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

function DueChip({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return <span className="text-[#6A6D70]">—</span>;
  const days = daysUntilDue(dueDate);
  if (days < 0) return <span className="text-xs font-medium text-[#BB0000]">Overdue {Math.abs(days)}d</span>;
  if (days <= 7) return <span className="text-xs font-medium text-amber-600">{days}d left</span>;
  return <span className="text-xs text-[#6A6D70]">{new Date(dueDate).toLocaleDateString()}</span>;
}

export default function VendorInvoicesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    referenceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100)).padStart(4, '0')}`,
    amount: '',
    currency: 'USD',
    dueDate: '',
    poReference: '',
    notes: '',
  });

  const { data, isLoading } = useQuery<{ data: InvoiceDoc[]; meta: { total: number } }>({
    queryKey: ['vendor-invoices', filter],
    queryFn: () =>
      apiClient.get('/documents', {
        params: { type: 'INVOICE', status: filter || undefined, limit: 50 },
      }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiClient.post('/documents', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-invoices'] });
      setShowCreate(false);
      setForm({
        referenceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100)).padStart(4, '0')}`,
        amount: '', currency: 'USD', dueDate: '', poReference: '', notes: '',
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/documents/${id}/send`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-invoices'] }),
  });

  const invoices = data?.data ?? [];
  const totalOutstanding = invoices
    .filter((i) => i.status === 'SENT')
    .reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const overdueCount = invoices
    .filter((i) => i.status === 'SENT' && i.dueDate && daysUntilDue(i.dueDate) < 0)
    .length;
  const paidThisMonth = invoices
    .filter((i) => i.status === 'PAID' && new Date(i.createdAt).getMonth() === new Date().getMonth())
    .reduce((s, i) => s + (i.totalAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Create, submit and track invoice payments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#107E3E' }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create Invoice
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card accent-blue p-5">
          <div className="text-xs text-[#6A6D70] font-bold uppercase tracking-wide mb-2">Outstanding</div>
          <div className="text-2xl font-extrabold text-[#0070F2]">USD {totalOutstanding.toLocaleString()}</div>
          <div className="text-xs text-[#6A6D70] mt-1">{invoices.filter(i => i.status === 'SENT').length} invoice{invoices.filter(i => i.status === 'SENT').length !== 1 ? 's' : ''} awaiting payment</div>
        </div>
        <div className={`stat-card p-5 ${overdueCount > 0 ? 'accent-red' : 'accent-green'}`}>
          <div className="text-xs text-[#6A6D70] font-bold uppercase tracking-wide mb-2">Overdue</div>
          <div className={`text-2xl font-extrabold ${overdueCount > 0 ? 'text-[#BB0000]' : 'text-[#107E3E]'}`}>
            {overdueCount}
          </div>
          <div className="text-xs text-[#6A6D70] mt-1">
            {overdueCount > 0 ? 'Requires immediate attention' : 'All invoices current'}
          </div>
        </div>
        <div className="stat-card accent-green p-5">
          <div className="text-xs text-[#6A6D70] font-bold uppercase tracking-wide mb-2">Paid This Month</div>
          <div className="text-2xl font-extrabold text-[#107E3E]">USD {paidThisMonth.toLocaleString()}</div>
          <div className="text-xs text-[#6A6D70] mt-1">{invoices.filter(i => i.status === 'PAID' && new Date(i.createdAt).getMonth() === new Date().getMonth()).length} invoice{invoices.filter(i => i.status === 'PAID').length !== 1 ? 's' : ''} received</div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              filter === s ? 'bg-[#107E3E] text-white border-[#107E3E]' : 'bg-white text-[#32363A] border-[#EDEDED] hover:border-gray-400'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Invoice table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-[#EDEDED]">
          <thead className="bg-[#F5F6F7]">
            <tr>
              {['Invoice #', 'Status', 'Amount', 'Due Date', 'Created', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-[#6A6D70] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#F5F6F7]">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : !invoices.length ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#6A6D70]">No invoices found</p>
                  <button onClick={() => setShowCreate(true)}
                    className="mt-2 text-xs text-[#0070F2] hover:underline">Create your first invoice</button>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F5F6F7]">
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-[#32363A]">{inv.referenceNumber}</div>
                    <div className="text-xs text-[#6A6D70]">{inv.type}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={STATUS_BADGE[inv.status] ?? 'badge-draft'}>{inv.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-[#32363A]">
                    {inv.totalAmount ? `${inv.currency} ${inv.totalAmount.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <DueChip dueDate={inv.dueDate} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#6A6D70]">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5">
                      {inv.status === 'DRAFT' && (
                        <button
                          onClick={() => sendMutation.mutate(inv.id)}
                          disabled={sendMutation.isPending}
                          className="text-xs px-2.5 py-1 rounded bg-blue-50 text-[#0070F2] hover:bg-blue-100 font-medium transition-colors"
                        >
                          Send
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
          <div className="px-5 py-3 bg-[#F5F6F7] border-t border-[#EDEDED] text-xs text-[#6A6D70]">
            {data.meta.total} total invoice{data.meta.total !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-[#EDEDED] flex items-center justify-between">
              <h3 className="font-semibold text-[#32363A]">Create Invoice</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#6A6D70] hover:text-[#32363A] text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Invoice Number *</label>
                  <input className="input w-full text-sm" value={form.referenceNumber}
                    onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">PO Reference</label>
                  <input className="input w-full text-sm" placeholder="PO-2026-XXXX"
                    value={form.poReference}
                    onChange={(e) => setForm((f) => ({ ...f, poReference: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Amount *</label>
                  <input type="number" className="input w-full text-sm" placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Currency</label>
                  <select className="input w-full text-sm" value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                    {['USD', 'EUR', 'GBP', 'JPY', 'CAD'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#32363A] mb-1">Due Date *</label>
                <input type="date" className="input w-full text-sm"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#32363A] mb-1">Notes</label>
                <textarea className="input w-full text-sm h-16 resize-none" placeholder="Payment terms, bank details, etc."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
              <button
                disabled={!form.referenceNumber || !form.amount || !form.dueDate || createMutation.isPending}
                onClick={() => createMutation.mutate({
                  type: 'INVOICE',
                  referenceNumber: form.referenceNumber,
                  currency: form.currency,
                  lineItems: [{ quantity: 1, unitPrice: Number(form.amount) }],
                  deliveryDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
                  notes: form.notes || undefined,
                })}
                className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-40 transition-colors"
                style={{ backgroundColor: '#107E3E' }}
              >
                {createMutation.isPending ? 'Creating…' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
