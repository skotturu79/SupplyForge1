'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { getStoredUser } from '@/lib/mock-auth';

interface KPIs {
  documentsThisMonth: number;
  activePartners: number;
  pendingInvoices: number;
  pendingInvoiceValue: number;
  shipmentsInTransit: number;
  onTimeDeliveryRate: number;
  invoiceMatchRate: number;
  otif: number;
  otifTarget: number;
  perfectOrderRate: number;
  fillRate: number;
  dso: number;
  paymentTermsDays: number;
  avgAckTimeHours: number;
  defectRate: number;
  leadTimeCompliance: number;
  ackComplianceRate: number;
}

interface ActivityItem {
  id: string; type: string; title: string;
  description: string; link: string; timestamp: string; color: string;
}

// ── Helpers ────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-600', amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700', red: 'bg-red-100 text-red-600',
};

const ACT_ICON: Record<string, React.ReactNode> = {
  PO_RECEIVED:    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>,
  INVOICE_PAID:   <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>,
  INVOICE_SENT:   <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>,
  SHIPMENT_OFD:   <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1H5V5a1 1 0 00-1-1H3zM14 7a1 1 0 011 1v1h2.05A2.5 2.5 0 0119 11.5V14a1 1 0 01-1 1h-1.05a2.5 2.5 0 01-4.9 0H11V8a1 1 0 011-1h2z" /></svg>,
  PO_ACCEPTED:    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>,
  PARTNER_JOINED: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>,
};

// ── Sub-components ─────────────────────────────────────────────
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const barColor: Record<string, string> = {
    green: 'bg-[#107E3E]', blue: 'bg-[#0070F2]', amber: 'bg-amber-500', red: 'bg-red-500',
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#32363A] font-medium">{label}</span>
        <span className="text-xs font-bold text-[#32363A]">{value}%</span>
      </div>
      <div className="h-2 bg-[#EDEDED] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor[color] ?? 'bg-[#0070F2]'}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function VendorDashboardPage() {
  const user = getStoredUser();
  const { data: kpis, isLoading: kpisLoading } = useQuery<KPIs>({
    queryKey: ['vendor-kpis'],
    queryFn: () => apiClient.get('/analytics/kpis').then((r) => r.data),
  });

  const { data: notifData } = useQuery<{
    data: Array<{ id: string; type: string; title: string; message: string; link: string; read: boolean; createdAt: string }>;
    activity: ActivityItem[];
    unread: number;
  }>({
    queryKey: ['vendor-notifications'],
    queryFn: () => apiClient.get('/notifications').then((r) => r.data),
  });

  const { data: recentDocs } = useQuery<{
    data: Array<{ id: string; type: string; status: string; referenceNumber: string; totalAmount?: number; currency: string; createdAt: string }>;
  }>({
    queryKey: ['vendor-recent-docs'],
    queryFn: () => apiClient.get('/documents?limit=6').then((r) => r.data),
  });

  const statusBadge: Record<string, string> = {
    DRAFT: 'badge-draft', SENT: 'badge-sent',
    ACKNOWLEDGED: 'badge-acknowledged', ACCEPTED: 'badge-accepted',
    REJECTED: 'badge-rejected', PAID: 'badge-paid',
  };

  const alerts   = notifData?.data?.filter((n) => !n.read) ?? [];
  const activity = notifData?.activity ?? [];
  const otifGap  = (kpis?.otifTarget ?? 95) - (kpis?.otif ?? 89);

  return (
    <div className="space-y-5">

      {/* ── GREETING HERO ──────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #354A5E 0%, #1B4332 70%, #107E3E 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="live-dot-green" />
            <span className="text-white/60 text-xs font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            {greeting()}, {user?.tenantName ?? 'Vendor'}
          </h1>
          <p className="text-white/65 text-sm mt-1">
            Here&apos;s your supply chain snapshot for today.
          </p>
        </div>

        {/* Score + tier badge */}
        <div className="relative z-10 flex flex-col items-end gap-2">
          <span className="tier-trusted text-[11px] bg-white/10 border-white/20 text-white">★ Trusted Supplier</span>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-white leading-none">90</div>
            <div className="text-white/60 text-[11px] mt-0.5">Supplier Score / 100</div>
          </div>
          <Link href="/vendor/analytics"
            className="text-[11px] text-white/70 hover:text-white transition-colors underline underline-offset-2">
            View full scorecard →
          </Link>
        </div>
      </div>

      {/* ── SMART ATTENTION STRIP ──────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="attn-warn">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-600 flex-shrink-0">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{alerts.length} item{alerts.length > 1 ? 's' : ''} need your attention — </span>
            <span className="font-normal opacity-80">
              {alerts.slice(0, 2).map((a) => a.title).join(' · ')}
              {alerts.length > 2 ? ` · +${alerts.length - 2} more` : ''}
            </span>
          </div>
          <Link href="/vendor/documents" className="text-amber-700 font-semibold text-xs whitespace-nowrap hover:underline flex-shrink-0">
            Review →
          </Link>
        </div>
      )}

      {/* OTIF gap strip */}
      {otifGap > 0 && (
        <div className="attn-info">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="flex-1">OTIF is <strong>{kpis?.otif ?? 89}%</strong> — {otifGap} pp below the {kpis?.otifTarget ?? 95}% buyer target. Focus on lead time compliance to close the gap.</span>
          <Link href="/vendor/analytics" className="text-blue-700 font-semibold text-xs whitespace-nowrap hover:underline flex-shrink-0">
            Analytics →
          </Link>
        </div>
      )}

      {/* ── PRIMARY KPI ROW (OTIF + Perfect Order + OTD + Fill) ── */}
      {kpisLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* OTIF hero */}
          <Link href="/vendor/analytics"
            className="stat-card accent-green p-5 block hover:no-underline">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs font-bold text-[#6A6D70] uppercase tracking-wide">OTIF</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-[#107E3E] font-bold border border-emerald-200">
                target {kpis?.otifTarget ?? 95}%
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#107E3E] leading-none">{kpis?.otif ?? 89}%</div>
            <div className="text-xs text-[#6A6D70] mt-1.5 mb-3">On Time In Full</div>
            <div className="h-1.5 bg-[#EDEDED] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${kpis?.otif ?? 89}%`, background: 'linear-gradient(90deg,#107E3E,#34D399)' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[#6A6D70]">0%</span>
              <span className="text-[10px] text-[#6A6D70]">Target {kpis?.otifTarget ?? 95}%</span>
              <span className="text-[10px] text-[#6A6D70]">100%</span>
            </div>
          </Link>

          {/* Perfect Order */}
          <Link href="/vendor/analytics" className="stat-card accent-blue p-5 block hover:no-underline">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs font-bold text-[#6A6D70] uppercase tracking-wide">Perfect Order</div>
              <span className="trend-up">↑ 2%</span>
            </div>
            <div className="text-3xl font-extrabold text-[#0070F2] leading-none">{kpis?.perfectOrderRate ?? 87}%</div>
            <div className="text-xs text-[#6A6D70] mt-1.5">On-time · In-full · Undamaged · Docs</div>
          </Link>

          {/* On-Time Delivery */}
          <Link href="/vendor/analytics" className="stat-card accent-teal p-5 block hover:no-underline">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs font-bold text-[#6A6D70] uppercase tracking-wide">On-Time Delivery</div>
              <span className="trend-up">↑ 2%</span>
            </div>
            <div className="text-3xl font-extrabold text-[#0D9488] leading-none">{kpis?.onTimeDeliveryRate ?? 94}%</div>
            <div className="text-xs text-[#6A6D70] mt-1.5">OT component of OTIF</div>
          </Link>

          {/* Fill Rate */}
          <Link href="/vendor/analytics" className="stat-card accent-purple p-5 block hover:no-underline">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs font-bold text-[#6A6D70] uppercase tracking-wide">Fill Rate (IF)</div>
              <span className="trend-flat">→ 0%</span>
            </div>
            <div className="text-3xl font-extrabold text-[#6B3FA0] leading-none">{kpis?.fillRate ?? 96}%</div>
            <div className="text-xs text-[#6A6D70] mt-1.5">In-Full component of OTIF</div>
          </Link>
        </div>
      )}

      {/* ── OPERATIONAL KPI ROW ─────────────────────────────────── */}
      {!kpisLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Active Partners */}
          <Link href="/vendor/connections" className="stat-card accent-green p-4 block hover:no-underline">
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-[#107E3E] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
              </span>
              <span className="trend-up">↑ 20%</span>
            </div>
            <div className="text-2xl font-extrabold text-[#32363A]">{kpis?.activePartners ?? 0}</div>
            <div className="text-xs text-[#6A6D70] font-medium mt-0.5">Active Partners</div>
          </Link>

          {/* Orders This Month */}
          <Link href="/vendor/documents" className="stat-card accent-blue p-4 block hover:no-underline">
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#0070F2] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
              </span>
              <span className="trend-up">↑ 12%</span>
            </div>
            <div className="text-2xl font-extrabold text-[#32363A]">{kpis?.documentsThisMonth ?? 0}</div>
            <div className="text-xs text-[#6A6D70] font-medium mt-0.5">Orders This Month</div>
          </Link>

          {/* Pending Invoices */}
          <Link href="/vendor/invoices" className="stat-card accent-amber p-4 block hover:no-underline">
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-[#E9730C] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              </span>
            </div>
            <div className="text-2xl font-extrabold text-[#32363A]">{kpis?.pendingInvoices ?? 0}</div>
            <div className="text-xs text-[#6A6D70] font-medium mt-0.5">Pending Invoices</div>
            {kpis?.pendingInvoiceValue ? (
              <div className="text-[11px] text-[#E9730C] font-semibold mt-0.5">
                ${(kpis.pendingInvoiceValue / 1000).toFixed(0)}k outstanding
              </div>
            ) : null}
          </Link>

          {/* In Transit */}
          <Link href="/vendor/shipments" className="stat-card accent-purple p-4 block hover:no-underline">
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-purple-50 text-[#6B3FA0] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1H5V5a1 1 0 00-1-1H3zM14 7a1 1 0 011 1v1h2.05A2.5 2.5 0 0119 11.5V14a1 1 0 01-1 1h-1.05a2.5 2.5 0 01-4.9 0H11V8a1 1 0 011-1h2z" /></svg>
              </span>
              <span className="live-dot-blue" />
            </div>
            <div className="text-2xl font-extrabold text-[#32363A]">{kpis?.shipmentsInTransit ?? 0}</div>
            <div className="text-xs text-[#6A6D70] font-medium mt-0.5">In Transit</div>
          </Link>
        </div>
      )}

      {/* ── MAIN CONTENT: 2-COLUMN ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Left col: Recent docs + Quick actions */}
        <div className="lg:col-span-2 space-y-5">

          {/* Recent documents */}
          <div className="card-hero overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#EDEDED] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#32363A]">Recent Documents</h3>
              <Link href="/vendor/documents" className="text-xs text-[#0070F2] hover:underline font-medium">View all →</Link>
            </div>
            {!recentDocs?.data?.length ? (
              <div className="px-5 py-10 text-center text-sm text-[#6A6D70]">No documents yet.</div>
            ) : (
              <div className="divide-y divide-[#F5F6F7]">
                {recentDocs.data.map((doc) => (
                  <Link key={doc.id} href={`/vendor/documents/${doc.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-[#F9FAFB] transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#32363A] group-hover:text-[#0070F2] transition-colors">{doc.referenceNumber}</div>
                        <div className="text-xs text-[#6A6D70]">{doc.type} · {new Date(doc.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {doc.totalAmount ? (
                        <span className="text-sm font-bold text-[#32363A]">{doc.currency} {doc.totalAmount.toLocaleString()}</span>
                      ) : null}
                      <span className={statusBadge[doc.status] || 'badge-draft'}>{doc.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { href: '/vendor/documents', label: 'Review Orders',  sub: 'Acknowledge POs',    bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100',    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> },
              { href: '/vendor/invoices',  label: 'Submit Invoice', sub: 'Create & send',      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100',   icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg> },
              { href: '/vendor/shipments', label: 'Create ASN',     sub: 'Ship notice',       bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-100',  icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1H5V5a1 1 0 00-1-1H3zM14 7a1 1 0 011 1v1h2.05A2.5 2.5 0 0119 11.5V14a1 1 0 01-1 1h-1.05a2.5 2.5 0 01-4.9 0H11V8a1 1 0 011-1h2z" /></svg> },
              { href: '/vendor/analytics', label: 'Performance',    sub: 'View scorecard',    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg> },
            ].map(({ href, label, sub, bg, text, border, icon }) => (
              <Link key={href} href={href}
                className={`card p-4 flex flex-col items-start gap-2.5 hover:shadow-md transition-all border ${border} rounded-xl`}>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} ${text}`}>{icon}</span>
                <div>
                  <div className="text-xs font-bold text-[#32363A]">{label}</div>
                  <div className="text-[11px] text-[#6A6D70] mt-0.5">{sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right col: Activity + Performance scorecard */}
        <div className="space-y-5">

          {/* Activity feed */}
          <div className="card-hero overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#EDEDED]">
              <h3 className="text-sm font-semibold text-[#32363A]">Recent Activity</h3>
            </div>
            <div className="p-4 space-y-1">
              {activity.length === 0 ? (
                <p className="text-xs text-center text-[#6A6D70] py-6">No recent activity</p>
              ) : (
                activity.map((item) => (
                  <Link key={item.id} href={item.link}
                    className="flex gap-3 items-start group hover:bg-[#F9FAFB] -mx-4 px-4 py-2 rounded-lg transition-colors">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${COLOR_MAP[item.color] ?? 'bg-gray-100 text-gray-500'}`}>
                      {ACT_ICON[item.type] ?? <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><circle cx="10" cy="10" r="4" /></svg>}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#32363A] group-hover:text-[#0070F2] transition-colors leading-tight">{item.title}</p>
                      <p className="text-[11px] text-[#6A6D70] mt-0.5 leading-snug truncate">{item.description}</p>
                      <p className="text-[10px] text-[#9EA1A4] mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Performance scorecard */}
          <div className="card-hero overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#EDEDED] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#32363A]">Performance Score</h3>
              <Link href="/vendor/analytics" className="text-xs text-[#0070F2] hover:underline font-medium">Full report →</Link>
            </div>
            <div className="p-4 space-y-3.5">
              <ScoreBar label="On-Time Delivery"      value={kpis?.onTimeDeliveryRate  ?? 94} color="green" />
              <ScoreBar label="Invoice Match Rate"    value={kpis?.invoiceMatchRate     ?? 88} color="blue"  />
              <ScoreBar label="Fill Rate"             value={kpis?.fillRate             ?? 96} color="green" />
              <ScoreBar label="Ack Compliance"        value={kpis?.ackComplianceRate    ?? 96} color="green" />
              <ScoreBar label="Lead Time Compliance"  value={kpis?.leadTimeCompliance   ?? 92} color="blue"  />
              <div className="pt-2.5 border-t border-[#EDEDED]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6A6D70]">Overall Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#107E3E]">90 / 100</span>
                    <span className="tier-trusted text-[10px]">Top 10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
