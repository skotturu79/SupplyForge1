'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface DashboardKPIs {
  totalDocuments: number;
  documentsThisMonth: number;
  totalPartners: number;
  activePartners: number;
  pendingInvoices: number;
  pendingInvoiceValue: number;
  shipmentsInTransit: number;
  onTimeDeliveryRate: number;
  invoiceMatchRate: number;
  apiCallsThisMonth: number;
}

interface KpiCardProps {
  title: string;
  valueKey: keyof DashboardKPIs;
  subKey?: keyof DashboardKPIs;
  /** SAP Fiori semantic color: positive (green), critical (orange), info (blue), neutral (gray) */
  color: 'positive' | 'critical' | 'info' | 'neutral';
  /** Optional trend percentage (positive = up, negative = down) */
  trend?: number;
  icon: React.ReactNode;
}

const colorMap = {
  positive: { icon: 'text-[#107E3E] bg-green-50',  value: 'text-[#107E3E]' },
  critical: { icon: 'text-[#E9730C] bg-amber-50',  value: 'text-[#E9730C]' },
  info:     { icon: 'text-[#0070F2]   bg-blue-50',    value: 'text-[#0070F2]'    },
  neutral:  { icon: 'text-[#6A6D70]  bg-gray-100',   value: 'text-[#32363A]'     },
};

export function KpiCard({ title, valueKey, subKey, color, trend, icon }: KpiCardProps) {
  const { data: kpis, isLoading } = useQuery<DashboardKPIs>({
    queryKey: ['kpis'],
    queryFn: () => apiClient.get('/analytics/kpis').then((r) => r.data),
  });

  const c = colorMap[color];

  return (
    <div className="card p-4 flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-[#6A6D70] leading-snug pr-2">{title}</span>
        <span className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-sm ${c.icon}`}>
          {icon}
        </span>
      </div>

      {/* Value */}
      {isLoading ? (
        <div className="h-7 bg-gray-100 rounded animate-pulse w-2/3" />
      ) : (
        <div className={`text-2xl font-semibold leading-none ${c.value}`}>
          {kpis?.[valueKey]?.toLocaleString() ?? '—'}
        </div>
      )}

      {/* Sub-label or trend */}
      <div className="flex items-center justify-between mt-auto">
        {subKey && kpis?.[subKey] !== undefined ? (
          <span className="text-xs text-[#6A6D70]">
            ${(kpis[subKey] as number).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            value
          </span>
        ) : (
          <span />
        )}
        {trend !== undefined && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 ${
              trend >= 0 ? 'text-[#107E3E]' : 'text-[#BB0000]'
            }`}
          >
            {trend >= 0 ? (
              <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
                <path d="M6 2l4 6H2l4-6z" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
                <path d="M6 10L2 4h8l-4 6z" />
              </svg>
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
