'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

const statusClasses: Record<string, string> = {
  DRAFT: 'badge-draft', SENT: 'badge-sent', ACKNOWLEDGED: 'badge-acknowledged',
  ACCEPTED: 'badge-accepted', REJECTED: 'badge-rejected', PAID: 'badge-paid', CANCELLED: 'badge-cancelled',
};

export default function DocumentsPage() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', type, status, page],
    queryFn: () =>
      apiClient.get('/documents', { params: { type: type || undefined, status: status || undefined, page, limit: 20 } })
        .then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Purchase orders, invoices, ASNs and more</p>
        </div>
        <div className="flex gap-2">
          <Link href="/documents/po/new" className="btn-primary">New PO</Link>
          <Link href="/documents/invoice/new" className="btn-secondary">New Invoice</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-4">
        <select value={type} onChange={(e) => setType(e.target.value)} className="input w-40">
          <option value="">All types</option>
          {['PO', 'INVOICE', 'ASN', 'DELIVERY_NOTE', 'LABEL', 'BOL'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-48">
          <option value="">All statuses</option>
          {['DRAFT', 'SENT', 'ACKNOWLEDGED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'PAID'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Reference', 'Type', 'Status', 'Amount', 'Created'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading
              ? [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
              : data?.data?.map((doc: { id: string; referenceNumber: string; type: string; status: string; totalAmount?: number; currency: string; createdAt: string }) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/documents/${doc.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                      {doc.referenceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.type}</td>
                  <td className="px-6 py-4">
                    <span className={statusClasses[doc.status] || 'badge-draft'}>{doc.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {doc.totalAmount ? `${doc.currency} ${doc.totalAmount.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.meta && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {((page - 1) * 20) + 1}–{Math.min(page * 20, data.meta.total)} of {data.meta.total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="btn-secondary text-xs py-1 px-2">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={!data.meta.hasMore} className="btn-secondary text-xs py-1 px-2">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
