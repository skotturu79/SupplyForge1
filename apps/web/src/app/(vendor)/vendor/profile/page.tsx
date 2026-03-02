'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ──────────────────────────────────────────────────────
interface VendorProfile {
  id: string; name: string; slug: string; country: string;
  website?: string; vatId?: string; planTier: string; status: string;
  address?: { street?: string; city?: string; state?: string; zip?: string; country?: string };
  vendorProfile?: {
    categories: string[]; verificationStatus: string;
    rating?: number; reviewCount: number; leadTimeDays?: number; certifications?: string[];
  };
}

interface Banking {
  accountHolderName: string; bankName: string; bankCountry: string; currency: string;
  accountType: string; iban: string; swiftBic: string; routingNumber: string;
  accountNumber: string; sortCode: string; bankAddress: string;
  intermediaryBank: string; paymentReference: string;
  verified: boolean; verifiedAt: string | null;
}

interface TaxInfo {
  legalEntityName: string; companyRegNumber: string; taxId: string;
  vatNumber: string; gstHstNumber: string; gstin: string; abn: string;
  taxJurisdiction: string; taxExempt: boolean; taxExemptReason: string;
  w9Status: string; w8Status: string; dunsNumber: string; leiCode: string;
  updatedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────
const W_STATUS: Record<string, { label: string; cls: string }> = {
  NOT_REQUIRED: { label: 'Not Required', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  PENDING:      { label: 'Pending',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  SUBMITTED:    { label: 'Submitted',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  VERIFIED:     { label: 'Verified ✓',  cls: 'bg-emerald-50 text-[#107E3E] border-emerald-200' },
};

function maskIban(iban: string) {
  if (!iban || iban.length < 8) return iban;
  const clean = iban.replace(/\s/g, '');
  return clean.slice(0, 4) + ' **** **** ' + clean.slice(-4);
}

function SectionCard({ title, icon, badge, children, action }: {
  title: string; icon: React.ReactNode; badge?: React.ReactNode;
  children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="card-hero overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EDEDED] flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%)' }}>
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-[#354A5E]/10 text-[#354A5E] flex items-center justify-center flex-shrink-0">
            {icon}
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#32363A]">{title}</h2>
            {badge}
          </div>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9EA1A4] mb-1">{label}</dt>
      <dd className={`text-sm font-medium text-[#32363A] ${mono ? 'font-mono' : ''}`}>{value || <span className="text-[#CBCBCB] font-normal">—</span>}</dd>
    </div>
  );
}

function EditInput({ label, value, onChange, placeholder, mono = false, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#32363A] mb-1">{label}</label>
      <input
        type={type}
        className={`input w-full text-sm ${mono ? 'font-mono' : ''}`}
        value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function EditSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#32363A] mb-1">{label}</label>
      <select className="input w-full text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const SAVE_BTN = 'rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40 transition-colors';

// ── Page ───────────────────────────────────────────────────────
export default function VendorProfilePage() {
  const qc = useQueryClient();

  // Edit state per section
  const [editCompany,  setEditCompany]  = useState(false);
  const [editBanking,  setEditBanking]  = useState(false);
  const [editTax,      setEditTax]      = useState(false);
  const [showFullIban, setShowFullIban] = useState(false);
  const [bankingForm,  setBankingForm]  = useState<Partial<Banking>>({});
  const [taxForm,      setTaxForm]      = useState<Partial<TaxInfo>>({});
  const [companyForm,  setCompanyForm]  = useState<Partial<VendorProfile>>({});

  // Queries
  const { data: profile, isLoading } = useQuery<VendorProfile>({
    queryKey: ['vendor-profile'],
    queryFn: () => apiClient.get('/tenants/me').then((r) => r.data),
  });
  const { data: banking, isLoading: bankingLoading } = useQuery<Banking>({
    queryKey: ['vendor-banking'],
    queryFn: () => apiClient.get('/vendor/banking').then((r) => r.data),
  });
  const { data: tax, isLoading: taxLoading } = useQuery<TaxInfo>({
    queryKey: ['vendor-tax'],
    queryFn: () => apiClient.get('/vendor/tax').then((r) => r.data),
  });

  useEffect(() => { if (profile) setCompanyForm(profile); }, [profile]);
  useEffect(() => { if (banking) setBankingForm(banking); }, [banking]);
  useEffect(() => { if (tax)     setTaxForm(tax);         }, [tax]);

  // Mutations
  const saveCompany = useMutation({
    mutationFn: (d: Partial<VendorProfile>) => apiClient.patch('/tenants/me', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-profile'] }); setEditCompany(false); },
  });
  const saveBanking = useMutation({
    mutationFn: (d: Partial<Banking>) => apiClient.patch('/vendor/banking', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-banking'] }); setEditBanking(false); },
  });
  const saveTax = useMutation({
    mutationFn: (d: Partial<TaxInfo>) => apiClient.patch('/vendor/tax', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-tax'] }); setEditTax(false); },
  });

  const verStatus = profile?.vendorProfile?.verificationStatus ?? 'PENDING';

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── PAGE HEADER ────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Profile</h1>
          <p className="page-subtitle">Manage company details, banking, and compliance documents</p>
        </div>
        <span className={`tier-trusted`}>★ Trusted Supplier</span>
      </div>

      {/* ── VERIFICATION BANNER ────────────────────────────────── */}
      <div className={`rounded-2xl border p-4 flex items-start gap-4 ${
        verStatus === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200' :
        verStatus === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
          verStatus === 'VERIFIED' ? 'bg-emerald-100' : verStatus === 'REJECTED' ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          {verStatus === 'VERIFIED' ? '✅' : verStatus === 'REJECTED' ? '❌' : '⏳'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-[#32363A]">Account Verification</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
              verStatus === 'VERIFIED' ? 'bg-emerald-50 text-[#107E3E] border-emerald-200' :
              verStatus === 'REJECTED' ? 'bg-red-50 text-[#BB0000] border-red-200' :
              'bg-amber-50 text-amber-700 border-amber-200'
            }`}>{verStatus}</span>
          </div>
          <p className="text-xs text-[#6A6D70] mt-0.5">
            {verStatus === 'VERIFIED'
              ? 'Your account is fully verified. You appear in the SupplyForge vendor directory and can transact with all buyers.'
              : verStatus === 'REJECTED'
              ? 'Verification was rejected. Please contact support at compliance@supplyforge.io.'
              : 'Pending review — we typically verify within 2 business days. Make sure your Tax ID and banking details are complete.'}
          </p>
        </div>
        {verStatus === 'VERIFIED' && banking?.verified && (
          <div className="flex-shrink-0 text-right">
            <div className="text-xs font-bold text-[#107E3E]">Banking Verified</div>
            <div className="text-[10px] text-[#6A6D70]">{banking.verifiedAt ? new Date(banking.verifiedAt).toLocaleDateString() : ''}</div>
          </div>
        )}
      </div>

      {/* ── COMPANY INFORMATION ────────────────────────────────── */}
      <SectionCard
        title="Company Information"
        icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>}
        action={!editCompany
          ? <button onClick={() => setEditCompany(true)} className="btn-secondary text-xs">Edit</button>
          : <div className="flex gap-2">
              <button onClick={() => saveCompany.mutate(companyForm)} disabled={saveCompany.isPending}
                className={SAVE_BTN} style={{ backgroundColor: '#107E3E' }}>
                {saveCompany.isPending ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setEditCompany(false); setCompanyForm(profile || {}); }} className="btn-secondary text-xs">Cancel</button>
            </div>
        }
      >
        {editCompany ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="Company Name *" value={companyForm.name || ''} onChange={(v) => setCompanyForm((f) => ({ ...f, name: v }))} />
              <EditInput label="Country (ISO 3166-1 alpha-2)" value={companyForm.country || ''} onChange={(v) => setCompanyForm((f) => ({ ...f, country: v }))} placeholder="DE" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="Website" value={companyForm.website || ''} onChange={(v) => setCompanyForm((f) => ({ ...f, website: v }))} placeholder="https://" />
              <EditInput label="VAT ID" value={companyForm.vatId || ''} onChange={(v) => setCompanyForm((f) => ({ ...f, vatId: v }))} placeholder="DE287654321" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <EditInput label="Street" value={companyForm.address?.street || ''} onChange={(v) => setCompanyForm((f) => ({ ...f, address: { ...f.address, street: v } }))} />
              <EditInput label="City" value={companyForm.address?.city || ''} onChange={(v) => setCompanyForm((f) => ({ ...f, address: { ...f.address, city: v } }))} />
              <EditInput label="ZIP / Postal Code" value={companyForm.address?.zip || ''} onChange={(v) => setCompanyForm((f) => ({ ...f, address: { ...f.address, zip: v } }))} />
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            <Field label="Company Name"   value={profile?.name} />
            <Field label="Country"        value={profile?.country} />
            <Field label="Plan Tier"      value={profile?.planTier} />
            <Field label="Website"        value={profile?.website} />
            <Field label="VAT ID"         value={profile?.vatId} />
            <Field label="Portal Slug"    value={`@${profile?.slug}`} mono />
            <Field label="Street"         value={profile?.address?.street} />
            <Field label="City"           value={profile?.address?.city} />
            <Field label="ZIP"            value={profile?.address?.zip} />
          </dl>
        )}
      </SectionCard>

      {/* ── TAX & COMPLIANCE ───────────────────────────────────── */}
      <SectionCard
        title="Tax & Compliance"
        icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" /></svg>}
        action={!editTax
          ? <button onClick={() => setEditTax(true)} className="btn-secondary text-xs">Edit</button>
          : <div className="flex gap-2">
              <button onClick={() => saveTax.mutate(taxForm)} disabled={saveTax.isPending}
                className={SAVE_BTN} style={{ backgroundColor: '#107E3E' }}>
                {saveTax.isPending ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setEditTax(false); setTaxForm(tax || {}); }} className="btn-secondary text-xs">Cancel</button>
            </div>
        }
      >
        {taxLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-8" />)}</div>
        ) : editTax ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="Legal Entity Name" value={taxForm.legalEntityName || ''} onChange={(v) => setTaxForm((f) => ({ ...f, legalEntityName: v }))} />
              <EditInput label="Company Registration Number" value={taxForm.companyRegNumber || ''} onChange={(v) => setTaxForm((f) => ({ ...f, companyRegNumber: v }))} placeholder="HRB 12345" mono />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="Tax ID / EIN (US)" value={taxForm.taxId || ''} onChange={(v) => setTaxForm((f) => ({ ...f, taxId: v }))} placeholder="12-3456789" mono />
              <EditInput label="VAT Number" value={taxForm.vatNumber || ''} onChange={(v) => setTaxForm((f) => ({ ...f, vatNumber: v }))} placeholder="DE287654321" mono />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <EditInput label="GSTIN (India)" value={taxForm.gstin || ''} onChange={(v) => setTaxForm((f) => ({ ...f, gstin: v }))} placeholder="27AAACR5055K1Z5" mono />
              <EditInput label="ABN (Australia)" value={taxForm.abn || ''} onChange={(v) => setTaxForm((f) => ({ ...f, abn: v }))} placeholder="51 824 753 556" mono />
              <EditInput label="GST/HST (Canada)" value={taxForm.gstHstNumber || ''} onChange={(v) => setTaxForm((f) => ({ ...f, gstHstNumber: v }))} placeholder="123456789RT0001" mono />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <EditInput label="DUNS Number" value={taxForm.dunsNumber || ''} onChange={(v) => setTaxForm((f) => ({ ...f, dunsNumber: v }))} placeholder="30-000-1234" mono />
              <EditInput label="LEI Code" value={taxForm.leiCode || ''} onChange={(v) => setTaxForm((f) => ({ ...f, leiCode: v }))} placeholder="529900T8BM49AURSDO55" mono />
              <EditInput label="Tax Jurisdiction" value={taxForm.taxJurisdiction || ''} onChange={(v) => setTaxForm((f) => ({ ...f, taxJurisdiction: v }))} placeholder="DE" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <EditSelect label="W-9 Status (US domestic)" value={taxForm.w9Status || 'NOT_REQUIRED'}
                onChange={(v) => setTaxForm((f) => ({ ...f, w9Status: v }))}
                options={[
                  { value: 'NOT_REQUIRED', label: 'Not Required' },
                  { value: 'PENDING',      label: 'Pending' },
                  { value: 'SUBMITTED',    label: 'Submitted' },
                  { value: 'VERIFIED',     label: 'Verified' },
                ]} />
              <EditSelect label="W-8 Status (non-US withholding)" value={taxForm.w8Status || 'NOT_REQUIRED'}
                onChange={(v) => setTaxForm((f) => ({ ...f, w8Status: v }))}
                options={[
                  { value: 'NOT_REQUIRED', label: 'Not Required' },
                  { value: 'PENDING',      label: 'Pending' },
                  { value: 'SUBMITTED',    label: 'Submitted' },
                  { value: 'VERIFIED',     label: 'Verified' },
                ]} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" checked={taxForm.taxExempt || false}
                onChange={(e) => setTaxForm((f) => ({ ...f, taxExempt: e.target.checked }))} />
              <span className="text-sm text-[#32363A]">Tax Exempt</span>
            </label>
            {taxForm.taxExempt && (
              <EditInput label="Exemption Reason" value={taxForm.taxExemptReason || ''} onChange={(v) => setTaxForm((f) => ({ ...f, taxExemptReason: v }))} />
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              <Field label="Legal Entity Name"          value={tax?.legalEntityName} />
              <Field label="Company Reg. Number"        value={tax?.companyRegNumber} mono />
              <Field label="Tax ID / EIN"               value={tax?.taxId} mono />
              <Field label="VAT Number"                 value={tax?.vatNumber} mono />
              <Field label="Tax Jurisdiction"           value={tax?.taxJurisdiction} />
              <Field label="DUNS Number"                value={tax?.dunsNumber} mono />
              <Field label="LEI Code"                   value={tax?.leiCode} mono />
              <Field label="GSTIN (India)"              value={tax?.gstin} mono />
              <Field label="ABN (Australia)"            value={tax?.abn} mono />
            </dl>

            {/* W-forms + status */}
            <div className="pt-4 border-t border-[#EDEDED]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9EA1A4] mb-3">IRS Withholding Forms</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'W-9 (US Domestic)', status: tax?.w9Status ?? 'NOT_REQUIRED', desc: 'Required for US-based vendors receiving US-sourced income' },
                  { label: 'W-8 (Non-US)',       status: tax?.w8Status ?? 'NOT_REQUIRED', desc: 'Required for non-US vendors to certify foreign status' },
                ].map(({ label, status, desc }) => {
                  const s = W_STATUS[status] ?? W_STATUS.NOT_REQUIRED;
                  return (
                    <div key={label} className={`p-4 rounded-xl border ${s.cls}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#32363A]">{label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                      </div>
                      <p className="text-[10px] text-[#6A6D70] leading-snug">{desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {tax?.taxExempt && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span><strong>Tax Exempt</strong> — {tax.taxExemptReason || 'Exemption certificate on file'}</span>
              </div>
            )}
            {tax?.updatedAt && (
              <p className="text-[10px] text-[#9EA1A4]">Last updated: {new Date(tax.updatedAt).toLocaleString()}</p>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── BANKING INFORMATION ────────────────────────────────── */}
      <SectionCard
        title="Banking Information"
        icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
        badge={banking?.verified
          ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#107E3E] border border-emerald-200">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Bank Verified
            </span>
          : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Unverified</span>
        }
        action={!editBanking
          ? <button onClick={() => setEditBanking(true)} className="btn-secondary text-xs">Edit</button>
          : <div className="flex gap-2">
              <button onClick={() => saveBanking.mutate(bankingForm)} disabled={saveBanking.isPending}
                className={SAVE_BTN} style={{ backgroundColor: '#107E3E' }}>
                {saveBanking.isPending ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setEditBanking(false); setBankingForm(banking || {}); }} className="btn-secondary text-xs">Cancel</button>
            </div>
        }
      >
        {bankingLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-8" />)}</div>
        ) : editBanking ? (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              <span>Banking details are encrypted at rest and only shared with authorised buyers for payment processing. Changes require re-verification.</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="Account Holder Name *" value={bankingForm.accountHolderName || ''} onChange={(v) => setBankingForm((f) => ({ ...f, accountHolderName: v }))} />
              <EditInput label="Bank Name *" value={bankingForm.bankName || ''} onChange={(v) => setBankingForm((f) => ({ ...f, bankName: v }))} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <EditInput label="Bank Country (ISO)" value={bankingForm.bankCountry || ''} onChange={(v) => setBankingForm((f) => ({ ...f, bankCountry: v }))} placeholder="DE" />
              <EditSelect label="Payment Currency"
                value={bankingForm.currency || 'USD'}
                onChange={(v) => setBankingForm((f) => ({ ...f, currency: v }))}
                options={['USD','EUR','GBP','JPY','CAD','AUD','CHF','SGD','INR'].map((c) => ({ value: c, label: c }))} />
              <EditSelect label="Account Type"
                value={bankingForm.accountType || 'CURRENT'}
                onChange={(v) => setBankingForm((f) => ({ ...f, accountType: v }))}
                options={[
                  { value: 'CURRENT',  label: 'Current / Business' },
                  { value: 'CHECKING', label: 'Checking' },
                  { value: 'SAVINGS',  label: 'Savings' },
                ]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="IBAN" value={bankingForm.iban || ''} onChange={(v) => setBankingForm((f) => ({ ...f, iban: v }))} placeholder="DE89 3704 0044 0532 0130 00" mono />
              <EditInput label="SWIFT / BIC" value={bankingForm.swiftBic || ''} onChange={(v) => setBankingForm((f) => ({ ...f, swiftBic: v }))} placeholder="DEUTDEDBXXX" mono />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <EditInput label="Account Number" value={bankingForm.accountNumber || ''} onChange={(v) => setBankingForm((f) => ({ ...f, accountNumber: v }))} mono />
              <EditInput label="Routing Number (US ABA)" value={bankingForm.routingNumber || ''} onChange={(v) => setBankingForm((f) => ({ ...f, routingNumber: v }))} placeholder="021000021" mono />
              <EditInput label="Sort Code (UK)" value={bankingForm.sortCode || ''} onChange={(v) => setBankingForm((f) => ({ ...f, sortCode: v }))} placeholder="20-00-00" mono />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="Bank Address" value={bankingForm.bankAddress || ''} onChange={(v) => setBankingForm((f) => ({ ...f, bankAddress: v }))} />
              <EditInput label="Intermediary Bank (if applicable)" value={bankingForm.intermediaryBank || ''} onChange={(v) => setBankingForm((f) => ({ ...f, intermediaryBank: v }))} />
            </div>
            <EditInput label="Payment Reference / Invoice Prefix" value={bankingForm.paymentReference || ''} onChange={(v) => setBankingForm((f) => ({ ...f, paymentReference: v }))} placeholder="GPLTD-001" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Primary account summary */}
            <div className="p-4 rounded-xl border border-[#EDEDED] bg-[#F8F9FA] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#354A5E] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                {(banking?.bankName ?? '??').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#32363A]">{banking?.bankName || '—'}</div>
                <div className="text-xs text-[#6A6D70]">{banking?.accountHolderName} · {banking?.accountType}</div>
                <div className="font-mono text-xs text-[#32363A] mt-0.5">
                  {showFullIban ? (banking?.iban || '—') : maskIban(banking?.iban || '')}
                  <button onClick={() => setShowFullIban((v) => !v)}
                    className="ml-2 text-[10px] text-[#0070F2] hover:underline">
                    {showFullIban ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-bold text-[#32363A]">{banking?.currency}</div>
                <div className="text-[10px] text-[#6A6D70]">{banking?.bankCountry}</div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              <Field label="Account Holder"       value={banking?.accountHolderName} />
              <Field label="SWIFT / BIC"          value={banking?.swiftBic} mono />
              <Field label="Account Number"       value={banking?.accountNumber} mono />
              <Field label="Routing Number (ABA)" value={banking?.routingNumber || '—'} mono />
              <Field label="Sort Code (UK)"       value={banking?.sortCode || '—'} mono />
              <Field label="Payment Reference"    value={banking?.paymentReference} mono />
              <Field label="Bank Address"         value={banking?.bankAddress} />
              <Field label="Intermediary Bank"    value={banking?.intermediaryBank || '—'} />
            </dl>

            <div className="pt-4 border-t border-[#EDEDED]">
              <p className="text-[10px] text-[#9EA1A4] mb-2 font-bold uppercase tracking-widest">Security</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'AES-256-GCM encrypted at rest',
                  'TLS 1.3 in transit',
                  'Access logged & audited',
                  'Shared only on payment authorisation',
                ].map((label) => (
                  <span key={label} className="inline-flex items-center gap-1 text-[10px] font-medium text-[#6A6D70] bg-[#F5F6F7] border border-[#EDEDED] px-2 py-1 rounded-full">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-[#107E3E] flex-shrink-0"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── CAPABILITIES ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Categories */}
        <SectionCard
          title="Product Categories"
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg>}
        >
          {profile?.vendorProfile?.categories?.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.vendorProfile.categories.map((cat) => (
                <span key={cat} className="text-xs bg-blue-50 text-[#0070F2] border border-blue-100 px-3 py-1 rounded-full font-medium">
                  {cat}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#9EA1A4]">No categories set. Add categories to appear in relevant buyer searches.</p>
          )}
        </SectionCard>

        {/* Certifications */}
        <SectionCard
          title="Certifications"
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
        >
          {profile?.vendorProfile?.certifications?.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.vendorProfile.certifications.map((cert) => (
                <span key={cert} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <span>🏅</span> {cert}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#9EA1A4]">No certifications listed. Contact support to add verified certifications.</p>
          )}
        </SectionCard>
      </div>

      {/* ── PERFORMANCE ────────────────────────────────────────── */}
      <SectionCard
        title="Performance Metrics"
        icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>}
      >
        <div className="grid grid-cols-3 gap-6 text-center">
          {[
            { label: 'Rating',       value: profile?.vendorProfile?.rating?.toFixed(1) ?? '—',     sub: '/ 5.0',  color: 'text-amber-500'   },
            { label: 'Reviews',      value: String(profile?.vendorProfile?.reviewCount ?? 0),        sub: 'buyers', color: 'text-[#0070F2]'  },
            { label: 'Lead Time',    value: profile?.vendorProfile?.leadTimeDays != null ? `${profile.vendorProfile.leadTimeDays}d` : '—', sub: 'average', color: 'text-[#107E3E]' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="p-4 rounded-xl bg-[#F8F9FA] border border-[#EDEDED]">
              <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs text-[#6A6D70] mt-0.5">{sub}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#9EA1A4] mt-1">{label}</div>
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  );
}
