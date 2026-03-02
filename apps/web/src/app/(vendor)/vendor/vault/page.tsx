'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────
type DocType   = 'ISO_CERT' | 'INSURANCE' | 'W9' | 'W8' | 'AUDIT_REPORT' | 'CUSTOMS' | 'OTHER';
type VaultStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING_REVIEW';

interface VaultDoc {
  id: string; docType: DocType; name: string; issuer: string;
  referenceNumber: string; issuedAt: string; expiresAt: string | null;
  status: VaultStatus; fileSize: number; fileType: string;
  uploadedAt: string; notes: string;
}

// ── Helpers ───────────────────────────────────────────────────────
const STATUS_CFG: Record<VaultStatus, { label: string; cls: string; icon: string }> = {
  VALID:          { label: 'Valid',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✓' },
  EXPIRING_SOON:  { label: 'Expiring Soon',   cls: 'bg-amber-50 text-amber-700 border-amber-200',      icon: '⚠' },
  EXPIRED:        { label: 'Expired',         cls: 'bg-red-50 text-red-600 border-red-200',            icon: '✗' },
  PENDING_REVIEW: { label: 'Pending Review',  cls: 'bg-blue-50 text-blue-700 border-blue-200',         icon: '…' },
};

const DOC_TYPE_CFG: Record<DocType, { label: string; color: string; icon: string }> = {
  ISO_CERT:     { label: 'ISO Certificate',    color: 'blue',   icon: '🏅' },
  INSURANCE:    { label: 'Insurance',          color: 'purple', icon: '🛡' },
  W9:           { label: 'W-9 Form',           color: 'teal',   icon: '📋' },
  W8:           { label: 'W-8 Form',           color: 'teal',   icon: '📋' },
  AUDIT_REPORT: { label: 'Audit Report',       color: 'orange', icon: '📊' },
  CUSTOMS:      { label: 'Customs / AEO',      color: 'green',  icon: '🛃' },
  OTHER:        { label: 'Other',              color: 'gray',   icon: '📄' },
};

function fmtSize(bytes: number) {
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysUntil(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

const DOC_TYPES: DocType[] = ['ISO_CERT', 'INSURANCE', 'W9', 'W8', 'AUDIT_REPORT', 'CUSTOMS', 'OTHER'];

const BLANK = { docType: 'ISO_CERT' as DocType, name: '', issuer: '', referenceNumber: '', issuedAt: '', expiresAt: '', notes: '' };

// ── Component ─────────────────────────────────────────────────────
export default function VaultPage() {
  const qc = useQueryClient();
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ ...BLANK });
  const [delId,   setDelId]   = useState<string | null>(null);
  const [preview, setPreview] = useState<VaultDoc | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-vault'],
    queryFn: () => apiClient.get('/vendor/vault').then((r) => r.data),
  });

  const docs:         VaultDoc[] = data?.data         ?? [];
  const expiringSoon: number     = data?.expiringSoon  ?? 0;
  const expired:      number     = data?.expired       ?? 0;

  const upload = useMutation({
    mutationFn: (payload: typeof form) => apiClient.post('/vendor/vault', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-vault'] }); setModal(false); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/vendor/vault/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-vault'] }); setDelId(null); },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#32363A]">Compliance Document Vault</h1>
          <p className="text-sm text-[#6A6D70] mt-1">Store, manage and track certifications, insurance and compliance documents</p>
        </div>
        <button onClick={() => { setForm({ ...BLANK }); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#107E3E,#0A5C2C)' }}>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
          Upload Document
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card accent-green p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Valid Documents</p>
          <p className="text-3xl font-bold text-[#107E3E] mt-1">{docs.filter((d) => d.status === 'VALID').length}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Up to date</p>
        </div>
        <div className={`stat-card p-5 ${expiringSoon > 0 ? 'accent-amber' : 'accent-green'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Expiring Soon</p>
          <p className={`text-3xl font-bold mt-1 ${expiringSoon > 0 ? 'text-amber-600' : 'text-[#107E3E]'}`}>{expiringSoon}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Within 90 days</p>
        </div>
        <div className={`stat-card p-5 ${expired > 0 ? 'accent-red' : 'accent-green'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Expired</p>
          <p className={`text-3xl font-bold mt-1 ${expired > 0 ? 'text-red-600' : 'text-[#107E3E]'}`}>{expired}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Renewal required</p>
        </div>
        <div className="stat-card accent-blue p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Total Documents</p>
          <p className="text-3xl font-bold text-[#0070F2] mt-1">{docs.length}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">In vault</p>
        </div>
      </div>

      {/* Alerts */}
      {expired > 0 && (
        <div className="attn-warn">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span><strong>{expired} document{expired > 1 ? 's' : ''}</strong> expired — upload renewed certificates to maintain compliance</span>
        </div>
      )}
      {expiringSoon > 0 && (
        <div className="attn-info">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
          <span><strong>{expiringSoon} document{expiringSoon > 1 ? 's' : ''}</strong> expiring within 90 days — schedule renewal soon</span>
        </div>
      )}

      {/* Document grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="card-hero p-12 text-center">
          <div className="w-16 h-16 bg-[#F0F2F4] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#C8CAD0]" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
          </div>
          <p className="text-base font-semibold text-[#6A6D70]">No documents uploaded yet</p>
          <p className="text-sm text-[#9EA1A4] mt-1">Upload ISO certificates, insurance, W-forms and more</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.map((doc) => {
            const s   = STATUS_CFG[doc.status];
            const dt  = DOC_TYPE_CFG[doc.docType];
            const exp = daysUntil(doc.expiresAt);
            return (
              <div key={doc.id} className="card-hero p-5 hover:shadow-lg transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F0F2F4] flex items-center justify-center text-xl flex-shrink-0">
                      {dt.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#32363A] leading-tight">{doc.name}</p>
                      <p className="text-xs text-[#9EA1A4] mt-0.5">{dt.label}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
                    {s.icon} {s.label}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                  <div>
                    <dt className="text-[#9EA1A4] font-medium">Issuer</dt>
                    <dd className="text-[#6A6D70] font-semibold">{doc.issuer}</dd>
                  </div>
                  <div>
                    <dt className="text-[#9EA1A4] font-medium">Ref #</dt>
                    <dd className="text-[#6A6D70] font-mono text-[10px]">{doc.referenceNumber || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#9EA1A4] font-medium">Issued</dt>
                    <dd className="text-[#6A6D70]">{fmtDate(doc.issuedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#9EA1A4] font-medium">Expires</dt>
                    <dd className={`font-semibold ${exp !== null && exp < 0 ? 'text-red-600' : exp !== null && exp < 90 ? 'text-amber-600' : 'text-[#6A6D70]'}`}>
                      {doc.expiresAt ? `${fmtDate(doc.expiresAt)}${exp !== null ? ` (${exp < 0 ? 'expired' : `${exp}d`})` : ''}` : 'No expiry'}
                    </dd>
                  </div>
                </dl>

                {doc.notes && (
                  <p className="text-[11px] text-[#9EA1A4] bg-[#F5F6F7] rounded-lg px-3 py-2 mb-3">{doc.notes}</p>
                )}

                <div className="flex items-center justify-between text-xs text-[#9EA1A4]">
                  <span>{doc.fileType} · {fmtSize(doc.fileSize)} · Uploaded {fmtDate(doc.uploadedAt)}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setPreview(doc)}
                      className="text-[#0070F2] hover:underline font-semibold">View</button>
                    <button onClick={() => setDelId(doc.id)}
                      className="text-red-500 hover:text-red-700">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-[#EDEDED] flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#354A5E,#2A3D52)' }}>
              <h2 className="text-base font-bold text-white">Upload Document</h2>
              <button onClick={() => setModal(false)} className="text-white/60 hover:text-white">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Simulated file upload drop zone */}
              <div className="border-2 border-dashed border-[#EDEDED] rounded-xl p-8 text-center bg-[#F5F6F7]">
                <svg className="w-10 h-10 text-[#C8CAD0] mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8zm0-4h8v2H8z"/></svg>
                <p className="text-sm text-[#6A6D70] font-medium">Drop PDF here or click to browse</p>
                <p className="text-xs text-[#9EA1A4] mt-1">PDF, JPG, PNG — max 10 MB</p>
                <button className="mt-3 px-4 py-1.5 text-xs font-semibold text-[#0070F2] border border-[#0070F2]/30 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  Browse Files
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Document Type *</label>
                <select value={form.docType} onChange={(e) => setForm((f) => ({ ...f, docType: e.target.value as DocType }))}
                  className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30">
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_CFG[t].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Document Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. ISO 9001:2015 Certificate"
                  className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Issuing Body</label>
                  <input value={form.issuer} onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))}
                    placeholder="e.g. TÜV SÜD"
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Reference Number</label>
                  <input value={form.referenceNumber} onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Issue Date</label>
                  <input type="date" value={form.issuedAt.slice(0, 10)}
                    onChange={(e) => setForm((f) => ({ ...f, issuedAt: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Expiry Date <span className="text-[#9EA1A4] normal-case font-normal">(optional)</span></label>
                  <input type="date" value={form.expiresAt?.slice(0, 10) ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#EDEDED] flex justify-end gap-3">
              <button onClick={() => setModal(false)}
                className="px-4 py-2 text-sm font-semibold text-[#6A6D70] bg-[#F0F2F4] rounded-lg hover:bg-[#E8EAF0]">Cancel</button>
              <button
                onClick={() => upload.mutate(form)}
                disabled={upload.isPending || !form.name || !form.issuedAt}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#107E3E,#0A5C2C)' }}>
                {upload.isPending ? 'Uploading…' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple preview panel */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-[#32363A] text-base">{preview.name}</h3>
                <p className="text-xs text-[#9EA1A4] mt-0.5">{DOC_TYPE_CFG[preview.docType].label} · {preview.fileType} · {fmtSize(preview.fileSize)}</p>
              </div>
              <button onClick={() => setPreview(null)} className="text-[#9EA1A4] hover:text-[#32363A]">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="h-48 bg-[#F5F6F7] rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-2">{DOC_TYPE_CFG[preview.docType].icon}</div>
                <p className="text-sm text-[#9EA1A4]">{preview.fileType} Document</p>
                <p className="text-xs text-[#C8CAD0] mt-1">Preview not available in demo mode</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              {[['Issuer', preview.issuer], ['Ref', preview.referenceNumber], ['Issued', fmtDate(preview.issuedAt)], ['Expires', fmtDate(preview.expiresAt)]].map(([k, v]) => (
                <div key={k}><dt className="text-[#9EA1A4] font-medium">{k}</dt><dd className="text-[#32363A] font-semibold">{v}</dd></div>
              ))}
            </dl>
            {preview.notes && <p className="text-xs text-[#6A6D70] bg-[#F5F6F7] rounded-lg p-3">{preview.notes}</p>}
            <button onClick={() => setPreview(null)}
              className="w-full py-2 text-sm font-semibold text-[#6A6D70] bg-[#F0F2F4] rounded-lg hover:bg-[#E8EAF0]">Close</button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <p className="font-bold text-[#32363A]">Delete this document?</p>
            <p className="text-sm text-[#6A6D70]">The document will be permanently removed from the vault.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDelId(null)} className="px-4 py-2 text-sm font-semibold text-[#6A6D70] bg-[#F0F2F4] rounded-lg">Cancel</button>
              <button onClick={() => remove.mutate(delId)} disabled={remove.isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
