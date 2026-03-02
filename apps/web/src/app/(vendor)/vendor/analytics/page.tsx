'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

// ── Types ──────────────────────────────────────────────────────────
interface KPIs {
  // Volume
  totalDocuments: number; documentsThisMonth: number;
  activePartners: number; pendingInvoices: number;
  pendingInvoiceValue: number; shipmentsInTransit: number;
  // OTIF
  otif: number; otifTarget: number;
  onTimeRate: number; inFullRate: number;
  otifTrend: Array<{ month: string; value: number }>;
  // Perfect Order
  perfectOrderRate: number;
  perfectOrderComponents: { onTime: number; inFull: number; damageFree: number; correctDocs: number };
  // Delivery
  onTimeDeliveryRate: number; fillRate: number; backorderRate: number;
  avgLeadTimeDays: number; committedLeadTimeDays: number; leadTimeCompliance: number;
  // Procurement
  avgAckTimeHours: number; ackSlaHours: number;
  ackComplianceRate: number; poAcceptanceRate: number;
  // Quality
  defectRate: number; returnRate: number; firstPassYield: number; qualityScore: number;
  // Financial
  invoiceMatchRate: number; invoiceAccuracyRate: number;
  dso: number; paymentTermsDays: number;
  paymentTermsCompliance: number; cashToCashCycleDays: number; earlyPaymentTaken: number;
  // ESG
  carbonPerShipmentKg: number; carbonReductionTarget: number;
}

interface TrendDay { date: string; PO: number; INVOICE: number; ASN: number; }

// ── Static data ───────────────────────────────────────────────────
const MONTHLY_DOCS = [
  { month: 'Sep', PO: 8,  INV: 4,  ASN: 3  },
  { month: 'Oct', PO: 11, INV: 7,  ASN: 5  },
  { month: 'Nov', PO: 9,  INV: 5,  ASN: 4  },
  { month: 'Dec', PO: 14, INV: 8,  ASN: 6  },
  { month: 'Jan', PO: 17, INV: 11, ASN: 7  },
  { month: 'Feb', PO: 20, INV: 14, ASN: 9  },
];

const PARTNERS = [
  { name: 'Acme Manufacturing Co.', country: 'US', docs: 38, otif: 91, otd: 96, fill: 97, tier: 'TRUSTED'   },
  { name: 'FastShip Logistics',     country: 'GB', docs: 12, otif: 85, otd: 92, fill: 94, tier: 'PREFERRED' },
];

const TIER_BADGE: Record<string, string> = {
  TRUSTED:   'bg-purple-100 text-purple-700',
  PREFERRED: 'bg-blue-100 text-blue-700',
  STANDARD:  'bg-gray-100 text-gray-600',
};

// ── Helper: KPI grade ─────────────────────────────────────────────
function grade(v: number, thresholds: [number, number, number] = [95, 90, 80]): {
  label: string; color: string; bg: string; border: string;
} {
  if (v >= thresholds[0]) return { label: 'Excellent', color: 'text-[#107E3E]', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (v >= thresholds[1]) return { label: 'Good',      color: 'text-[#0070F2]', bg: 'bg-blue-50',    border: 'border-blue-200'    };
  if (v >= thresholds[2]) return { label: 'Fair',      color: 'text-amber-600', bg: 'bg-amber-50',   border: 'border-amber-200'   };
  return                         { label: 'Poor',      color: 'text-[#BB0000]', bg: 'bg-red-50',     border: 'border-red-200'     };
}

// ── Components ────────────────────────────────────────────────────
function ScoreRing({ value, label, target, color, size = 'md' }: {
  value: number; label: string; target?: number; color: string; size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: { r: 28, w: 6, box: 72  }, md: { r: 36, w: 8, box: 96  }, lg: { r: 52, w: 10, box: 128 } };
  const { r, w, box } = sizes[size];
  const circ = 2 * Math.PI * r;
  const strokeColor: Record<string, string> = {
    green: '#107E3E', blue: '#0070F2', amber: '#E9730C', red: '#BB0000', purple: '#6B3FA0',
  };
  const fill = value / 100;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: box, height: box }}>
        <svg className="-rotate-90" viewBox={`0 0 ${box} ${box}`} style={{ width: box, height: box }}>
          {target && (
            <circle cx={box / 2} cy={box / 2} r={r} fill="none"
              stroke="#EDEDED" strokeWidth={w} strokeDasharray={`${circ * (target / 100)} ${circ * (1 - target / 100)}`}
              strokeLinecap="round" opacity={0.4} />
          )}
          <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="#F5F6F7" strokeWidth={w} />
          <circle cx={box / 2} cy={box / 2} r={r} fill="none"
            stroke={strokeColor[color] ?? '#0070F2'} strokeWidth={w}
            strokeLinecap="round"
            strokeDasharray={`${circ * fill} ${circ * (1 - fill)}`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-[#32363A] ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-base'}`}>{value}%</span>
          {target && <span className="text-[9px] text-[#6A6D70]">target {target}%</span>}
        </div>
      </div>
      <span className={`text-[#6A6D70] font-medium text-center ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>{label}</span>
    </div>
  );
}

function OtifSparkline({ data }: { data: Array<{ month: string; value: number }> }) {
  const min = Math.min(...data.map((d) => d.value)) - 5;
  const max = 100;
  const W = 200, H = 56;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.value - min) / (max - min)) * H;
    return `${x},${y}`;
  }).join(' ');
  const areaBottom = `${W},${H} 0,${H}`;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14 overflow-visible">
        <defs>
          <linearGradient id="otifGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#107E3E" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#107E3E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${pts} ${areaBottom}`} fill="url(#otifGrad)" />
        <polyline points={pts} fill="none" stroke="#107E3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * W;
          const y = H - ((d.value - min) / (max - min)) * H;
          return <circle key={i} cx={x} cy={y} r="3" fill="#107E3E" />;
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d) => (
          <div key={d.month} className="flex flex-col items-center">
            <span className="text-[9px] text-[#6A6D70]">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }: { data: typeof MONTHLY_DOCS }) {
  const maxVal = Math.max(...data.map((d) => d.PO + d.INV + d.ASN));
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d) => {
        const total = d.PO + d.INV + d.ASN;
        const h = Math.round((total / maxVal) * 100);
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-[#6A6D70]">{total}</span>
            <div className="w-full flex flex-col-reverse gap-px rounded-t overflow-hidden" style={{ height: `${h}%`, minHeight: 4 }}>
              <div style={{ height: `${(d.ASN / total) * 100}%` }} className="bg-purple-400" />
              <div style={{ height: `${(d.INV / total) * 100}%` }} className="bg-amber-400" />
              <div style={{ height: `${(d.PO / total) * 100}%`  }} className="bg-[#0070F2]" />
            </div>
            <span className="text-[9px] text-[#6A6D70]">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function KpiRow({ label, value, unit = '', sub, target, delta, tooltip }: {
  label: string; value: number | string; unit?: string; sub?: string;
  target?: string; delta?: number; tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F5F6F7] last:border-0 group" title={tooltip}>
      <div>
        <div className="text-sm font-medium text-[#32363A] flex items-center gap-1">
          {label}
          {tooltip && <span className="text-[#6A6D70] text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">(hover)</span>}
        </div>
        {sub && <div className="text-xs text-[#6A6D70]">{sub}</div>}
        {target && <div className="text-[10px] text-[#6A6D70]">Target: {target}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-bold text-[#32363A]">{value}{unit}</span>
        {delta !== undefined && (
          <span className={`text-xs font-medium ${delta >= 0 ? 'text-[#107E3E]' : 'text-[#BB0000]'}`}>
            {delta >= 0 ? '↑' : '↓'}{Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
}

function HBar({ label, value, color, benchmark }: {
  label: string; value: number; color: string; benchmark?: number;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-[#32363A]">{label}</span>
        <span className="text-xs font-bold text-[#32363A]">{value}%</span>
      </div>
      <div className="relative h-2 bg-[#EDEDED] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
        {benchmark && (
          <div className="absolute top-0 h-full w-0.5 bg-[#354A5E]/40 rounded"
            style={{ left: `${benchmark}%` }} title={`Benchmark: ${benchmark}%`} />
        )}
      </div>
      {benchmark && (
        <div className="text-[9px] text-[#6A6D70] mt-0.5 text-right">Industry avg: {benchmark}%</div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function VendorAnalyticsPage() {
  const { data: kpis, isLoading } = useQuery<KPIs>({
    queryKey: ['vendor-kpis'],
    queryFn: () => apiClient.get('/analytics/kpis').then((r) => r.data),
  });

  const { data: trends } = useQuery<TrendDay[]>({
    queryKey: ['vendor-trends'],
    queryFn: () => apiClient.get('/analytics/trends').then((r) => r.data),
  });

  const weeklyTotal = trends?.slice(-7).reduce((s, d) => s + d.PO + d.INVOICE + d.ASN, 0) ?? 0;
  const otifGrade   = grade(kpis?.otif ?? 89, [95, 90, 80]);
  const porGrade    = grade(kpis?.perfectOrderRate ?? 87, [95, 90, 80]);

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & KPIs</h1>
          <p className="page-subtitle">OTIF, Perfect Order, Procurement & Financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6A6D70]">Last 90 days</span>
          <button className="btn-secondary text-xs">Export PDF</button>
        </div>
      </div>

      {/* ── OTIF HERO ──────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-[#354A5E] to-[#1B4332] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-sm">On Time In Full (OTIF)</h2>
            <p className="text-white/60 text-xs mt-0.5">
              Orders delivered on time AND in full quantity — the industry gold standard KPI
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${otifGrade.bg} ${otifGrade.color} ${otifGrade.border}`}>
            {otifGrade.label}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-3">

          {/* Large OTIF ring */}
          <div className="flex flex-col items-center justify-center gap-3">
            <ScoreRing
              value={kpis?.otif ?? 89}
              label="OTIF Score"
              target={kpis?.otifTarget ?? 95}
              color="green"
              size="lg"
            />
            <div className="text-center">
              <div className={`text-xs font-bold ${otifGrade.color}`}>{otifGrade.label}</div>
              <div className="text-[10px] text-[#6A6D70]">Target: {kpis?.otifTarget ?? 95}%</div>
            </div>
          </div>

          {/* OT + IF component bars */}
          <div className="flex flex-col justify-center space-y-4">
            <div className="text-xs font-semibold text-[#32363A] mb-1">OTIF Components</div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-[#32363A] font-medium">On Time (OT)</span>
                <span className="text-xs font-bold text-[#32363A]">{kpis?.onTimeRate ?? 94}%</span>
              </div>
              <div className="h-3 bg-[#EDEDED] rounded-full overflow-hidden">
                <div className="h-full bg-[#0070F2] rounded-full" style={{ width: `${kpis?.onTimeRate ?? 94}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-[#32363A] font-medium">In Full (IF)</span>
                <span className="text-xs font-bold text-[#32363A]">{kpis?.inFullRate ?? 96}%</span>
              </div>
              <div className="h-3 bg-[#EDEDED] rounded-full overflow-hidden">
                <div className="h-full bg-[#107E3E] rounded-full" style={{ width: `${kpis?.inFullRate ?? 96}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-[#EDEDED]">
              <div className="flex justify-between">
                <span className="text-xs text-[#6A6D70]">OTIF = OT × IF</span>
                <span className="text-xs font-bold text-[#32363A]">
                  {kpis?.onTimeRate ?? 94}% × {kpis?.inFullRate ?? 96}% ≈ {kpis?.otif ?? 89}%
                </span>
              </div>
              <div className="text-[10px] text-[#6A6D70] mt-1">
                Gap to target: {(kpis?.otifTarget ?? 95) - (kpis?.otif ?? 89)} pp
              </div>
            </div>
          </div>

          {/* 6-month trend sparkline */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#32363A]">6-Month Trend</span>
              <span className="text-xs text-[#107E3E] font-medium">
                {(kpis?.otifTrend ?? []).length >= 2
                  ? `${(kpis!.otifTrend[kpis!.otifTrend.length - 1].value - kpis!.otifTrend[0].value) >= 0 ? '+' : ''}${kpis!.otifTrend[kpis!.otifTrend.length - 1].value - kpis!.otifTrend[0].value} pp`
                  : ''}
              </span>
            </div>
            {kpis?.otifTrend && <OtifSparkline data={kpis.otifTrend} />}
            <div className="mt-2 grid grid-cols-3 gap-1 text-center">
              {(kpis?.otifTrend ?? []).slice(-3).map((d) => (
                <div key={d.month}>
                  <div className="text-xs font-bold text-[#32363A]">{d.value}%</div>
                  <div className="text-[9px] text-[#6A6D70]">{d.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PERFECT ORDER + 8-KPI RINGS ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Perfect Order Rate */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#32363A]">Perfect Order Rate</h2>
              <p className="text-[11px] text-[#6A6D70]">On-time · In-full · Undamaged · Correct docs</p>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${porGrade.bg} ${porGrade.color} ${porGrade.border}`}>
              {porGrade.label}
            </span>
          </div>
          <div className="flex justify-center mb-4">
            <ScoreRing value={kpis?.perfectOrderRate ?? 87} label="Perfect Order Rate" color="blue" size="lg" />
          </div>
          <div className="space-y-2.5 pt-3 border-t border-[#EDEDED]">
            {[
              { label: 'On Time',           value: kpis?.perfectOrderComponents?.onTime     ?? 94, color: 'bg-[#0070F2]' },
              { label: 'In Full',           value: kpis?.perfectOrderComponents?.inFull     ?? 96, color: 'bg-[#107E3E]' },
              { label: 'Damage Free',       value: kpis?.perfectOrderComponents?.damageFree ?? 99, color: 'bg-emerald-400' },
              { label: 'Correct Documents', value: kpis?.perfectOrderComponents?.correctDocs ?? 97, color: 'bg-purple-500' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[11px] text-[#6A6D70]">{label}</span>
                  <span className="text-[11px] font-bold text-[#32363A]">{value}%</span>
                </div>
                <div className="h-1.5 bg-[#EDEDED] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 8-KPI rings grid */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-[#32363A]">Key Performance Indicators</h2>
            <span className="text-[10px] text-[#6A6D70] px-2 py-0.5 bg-[#F5F6F7] rounded">Last 90 days</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <ScoreRing value={kpis?.otif               ?? 89} label="OTIF"               target={95} color="green"  />
            <ScoreRing value={kpis?.perfectOrderRate    ?? 87} label="Perfect Order"                  color="blue"   />
            <ScoreRing value={kpis?.fillRate            ?? 96} label="Fill Rate"                       color="green"  />
            <ScoreRing value={kpis?.onTimeDeliveryRate  ?? 94} label="On-Time Delivery"               color="blue"   />
            <ScoreRing value={kpis?.ackComplianceRate   ?? 96} label="Ack Compliance"   target={98}   color="green"  />
            <ScoreRing value={kpis?.invoiceMatchRate    ?? 88} label="Invoice Match"                   color="amber"  />
            <ScoreRing value={kpis?.leadTimeCompliance  ?? 92} label="Lead Time"        target={95}   color="blue"   />
            <ScoreRing value={kpis?.qualityScore        ?? 97} label="Quality Score"                  color="green"  />
          </div>
          {/* Overall composite */}
          <div className="mt-5 pt-4 border-t border-[#EDEDED] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#107E3E]">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-[#32363A]">Composite Supplier Score: 90 / 100</div>
                <div className="text-xs text-[#107E3E]">Top 10% — Excellent performance</div>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-[#107E3E] border border-emerald-200">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              VERIFIED SUPPLIER
            </span>
          </div>
        </div>
      </div>

      {/* ── PROCUREMENT + DELIVERY ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[#32363A] mb-1">Procurement Responsiveness</h2>
          <p className="text-xs text-[#6A6D70] mb-4">How quickly and accurately you respond to orders</p>
          <KpiRow
            label="PO Acknowledgement Time"
            value={`${kpis?.avgAckTimeHours ?? 4.2}h`}
            sub="Average from PO receipt to acknowledgement"
            target={`< ${kpis?.ackSlaHours ?? 24}h SLA`}
            delta={-18}
            tooltip="Time from when a PO is received to when you acknowledge it"
          />
          <KpiRow
            label="Acknowledgement Compliance"
            value={kpis?.ackComplianceRate ?? 96}
            unit="%"
            sub="POs acknowledged within SLA window"
            target="98%"
            delta={2}
          />
          <KpiRow
            label="PO Acceptance Rate"
            value={kpis?.poAcceptanceRate ?? 94}
            unit="%"
            sub="POs accepted vs. rejected / cancelled"
            delta={1}
          />
          <KpiRow
            label="Avg Lead Time"
            value={`${kpis?.avgLeadTimeDays ?? 8.5} days`}
            sub={`Committed: ${kpis?.committedLeadTimeDays ?? 10} days`}
            delta={-5}
            tooltip="Average time from PO receipt to goods delivery"
          />
          <KpiRow
            label="Lead Time Compliance"
            value={kpis?.leadTimeCompliance ?? 92}
            unit="%"
            sub="Shipments within committed lead time"
            target="95%"
            delta={3}
          />
          <KpiRow
            label="Backorder Rate"
            value={`${kpis?.backorderRate ?? 3.8}%`}
            sub="Line items unavailable at time of order"
            tooltip="Lower is better — industry benchmark < 5%"
          />
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[#32363A] mb-1">Quality Performance</h2>
          <p className="text-xs text-[#6A6D70] mb-4">Goods quality and first-pass acceptance</p>
          <div className="space-y-3 mb-4">
            <HBar label="First Pass Yield"   value={kpis?.firstPassYield ?? 99}  color="bg-[#107E3E]" benchmark={97} />
            <HBar label="Quality Score"      value={kpis?.qualityScore   ?? 97}  color="bg-[#0070F2]" benchmark={95} />
            <HBar label="Damage-Free Rate"   value={kpis?.perfectOrderComponents?.damageFree ?? 99} color="bg-emerald-400" />
          </div>
          <div className="pt-3 border-t border-[#EDEDED] space-y-0">
            <KpiRow
              label="Defect Rate"
              value={`${kpis?.defectRate ?? 1.2}%`}
              sub="Units rejected / returned on receipt"
              tooltip="Percentage of delivered units failing quality inspection"
            />
            <KpiRow
              label="Return Rate"
              value={`${kpis?.returnRate ?? 0.8}%`}
              sub="Orders returned after delivery"
              delta={0}
            />
          </div>
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#107E3E] flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-[#107E3E]">Quality above industry average</p>
                <p className="text-[10px] text-[#107E3E]/80">Defect rate {kpis?.defectRate ?? 1.2}% vs industry avg 2.5%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FINANCIAL KPIS ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[#32363A] mb-1">Financial KPIs</h2>
          <p className="text-xs text-[#6A6D70] mb-4">Invoice accuracy, payment performance, cash cycle</p>
          <KpiRow
            label="Days Sales Outstanding (DSO)"
            value={`${kpis?.dso ?? 28} days`}
            sub={`Payment terms: ${kpis?.paymentTermsDays ?? 30} days net`}
            target="≤ 30 days"
            delta={-6}
            tooltip="Average number of days to collect payment after invoice sent"
          />
          <KpiRow
            label="Payment Terms Compliance"
            value={kpis?.paymentTermsCompliance ?? 72}
            unit="%"
            sub="Invoices paid within agreed terms"
            target="90%"
          />
          <KpiRow
            label="Invoice Match Rate"
            value={kpis?.invoiceMatchRate ?? 88}
            unit="%"
            sub="Invoices matched to PO without discrepancy"
            target="95%"
            delta={3}
            tooltip="High match rate = fewer disputes and faster payment"
          />
          <KpiRow
            label="Invoice Accuracy Rate"
            value={kpis?.invoiceAccuracyRate ?? 94}
            unit="%"
            sub="Invoices accepted first-pass without correction"
            delta={2}
          />
          <KpiRow
            label="Cash-to-Cash Cycle"
            value={`${kpis?.cashToCashCycleDays ?? 42} days`}
            sub="Time from supplier payment to customer collection"
            delta={-4}
            tooltip="Shorter cycle = better working capital efficiency"
          />
          <KpiRow
            label="Early Payment Discounts"
            value={kpis?.earlyPaymentTaken ?? 3}
            sub="Invoices with early-payment discount applied"
          />
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[#32363A] mb-4">Invoice Payment Breakdown</h2>
          <div className="space-y-3">
            <HBar label="Paid on Time"     value={73} color="bg-[#107E3E]" benchmark={68} />
            <HBar label="Paid Late"        value={15} color="bg-amber-500"             />
            <HBar label="Awaiting Payment" value={8}  color="bg-[#0070F2]"             />
            <HBar label="Disputed"         value={4}  color="bg-[#BB0000]"             />
          </div>
          <div className="mt-4 pt-3 border-t border-[#EDEDED] grid grid-cols-2 gap-3">
            {[
              { label: 'Avg. Days to Pay',    value: `${kpis?.dso ?? 28}d`,   sub: `Target ≤ ${kpis?.paymentTermsDays ?? 30}d`, good: (kpis?.dso ?? 28) <= (kpis?.paymentTermsDays ?? 30) },
              { label: 'Invoice Accuracy',    value: `${kpis?.invoiceAccuracyRate ?? 94}%`, sub: 'First-pass acceptance',            good: (kpis?.invoiceAccuracyRate ?? 94) >= 90 },
              { label: 'Cash-to-Cash',        value: `${kpis?.cashToCashCycleDays ?? 42}d`, sub: 'Working capital metric',          good: false },
              { label: 'Payment Compliance',  value: `${kpis?.paymentTermsCompliance ?? 72}%`, sub: 'Within agreed terms',          good: (kpis?.paymentTermsCompliance ?? 72) >= 90 },
            ].map(({ label, value, sub, good }) => (
              <div key={label} className={`p-3 rounded-lg border ${good ? 'bg-emerald-50 border-emerald-200' : 'bg-[#F5F6F7] border-[#EDEDED]'}`}>
                <div className={`text-sm font-bold ${good ? 'text-[#107E3E]' : 'text-[#32363A]'}`}>{value}</div>
                <div className="text-[10px] text-[#6A6D70] font-medium">{label}</div>
                <div className="text-[9px] text-[#6A6D70]">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── VOLUME + PARTNER OTIF ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#32363A]">Document Volume (6 months)</h2>
            <div className="flex items-center gap-3 text-[10px] text-[#6A6D70]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#0070F2] inline-block" />PO</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />Inv</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-400 inline-block" />ASN</span>
            </div>
          </div>
          <BarChart data={MONTHLY_DOCS} />
          <div className="mt-3 pt-3 border-t border-[#EDEDED] grid grid-cols-3 gap-2 text-center">
            <div><div className="text-base font-bold text-[#0070F2]">{MONTHLY_DOCS.reduce((s, d) => s + d.PO, 0)}</div><div className="text-[9px] text-[#6A6D70]">Purchase Orders</div></div>
            <div><div className="text-base font-bold text-amber-500">{MONTHLY_DOCS.reduce((s, d) => s + d.INV, 0)}</div><div className="text-[9px] text-[#6A6D70]">Invoices</div></div>
            <div><div className="text-base font-bold text-purple-500">{MONTHLY_DOCS.reduce((s, d) => s + d.ASN, 0)}</div><div className="text-[9px] text-[#6A6D70]">ASNs</div></div>
          </div>
          <KpiRow label="Total Processed" value={kpis?.totalDocuments ?? 127} sub="All time" delta={15} />
          <KpiRow label="This Month"      value={kpis?.documentsThisMonth ?? 38} sub="vs 34 last month" delta={12} />
          <KpiRow label="Last 7 Days"     value={weeklyTotal} sub="Across all document types" />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#32363A]">Partner OTIF Scorecard</h2>
            <Link href="/vendor/connections" className="text-xs text-[#0070F2] hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {PARTNERS.map((p) => {
              const g = grade(p.otif, [95, 90, 80]);
              return (
                <div key={p.name} className="p-3 bg-[#F5F6F7] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#354A5E] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#32363A]">{p.name}</div>
                        <div className="text-[10px] text-[#6A6D70]">{p.country} · {p.docs} docs</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TIER_BADGE[p.tier]}`}>{p.tier}</span>
                      <span className={`text-sm font-bold ${g.color}`}>{p.otif}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <div className="text-[9px] text-[#6A6D70] mb-0.5">OTIF</div>
                      <div className="h-1.5 bg-[#EDEDED] rounded-full overflow-hidden">
                        <div className="h-full bg-[#107E3E] rounded-full" style={{ width: `${p.otif}%` }} />
                      </div>
                      <div className="text-[9px] font-bold text-[#32363A] mt-0.5">{p.otif}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#6A6D70] mb-0.5">OTD</div>
                      <div className="h-1.5 bg-[#EDEDED] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0070F2] rounded-full" style={{ width: `${p.otd}%` }} />
                      </div>
                      <div className="text-[9px] font-bold text-[#32363A] mt-0.5">{p.otd}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#6A6D70] mb-0.5">Fill</div>
                      <div className="h-1.5 bg-[#EDEDED] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${p.fill}%` }} />
                      </div>
                      <div className="text-[9px] font-bold text-[#32363A] mt-0.5">{p.fill}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* ESG */}
          <div className="mt-4 p-3 bg-[#F5F6F7] rounded-lg border border-[#EDEDED]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#32363A]">Carbon per Shipment (ESG)</div>
                <div className="text-[10px] text-[#6A6D70]">Target: reduce {kpis?.carbonReductionTarget ?? 10}% annually</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-[#32363A]">{kpis?.carbonPerShipmentKg ?? 42} kg CO₂e</div>
                <div className="text-[10px] text-[#107E3E]">-8% vs last year</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DOCUMENT STATUS ──────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-[#32363A] mb-4">Document Status Snapshot</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            { label: 'Draft',        value: 1, badge: 'badge-draft'         },
            { label: 'Sent',         value: 3, badge: 'badge-sent'          },
            { label: 'Acknowledged', value: 2, badge: 'badge-acknowledged'  },
            { label: 'Accepted',     value: 1, badge: 'badge-accepted'      },
            { label: 'Paid',         value: 1, badge: 'badge-paid'          },
            { label: 'Rejected',     value: 1, badge: 'badge-rejected'      },
          ].map(({ label, value, badge }) => (
            <div key={label} className="card p-3 text-center">
              <div className="text-2xl font-bold text-[#32363A] mb-1">{value}</div>
              <span className={`${badge} text-xs`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
