'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { apiClient } from '@/lib/api-client';

interface TrendPoint { date: string; type: string; count: number }

// SAP Fiori semantic color palette for chart series
const CHART_COLORS = {
  PO:      '#0070F2', // fiori-brand (primary blue)
  INVOICE: '#107E3E', // fiori-positive (green)
  ASN:     '#E9730C', // fiori-critical (orange)
};

export function DocumentTrendChart() {
  const { data, isLoading } = useQuery<TrendPoint[]>({
    queryKey: ['document-trends'],
    queryFn: () => apiClient.get('/analytics/trends').then((r) => r.data),
  });

  return (
    <div className="card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#EDEDED]">
        <h3 className="text-sm font-semibold text-[#32363A]">Document Activity (30 days)</h3>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="h-48 bg-[#F5F6F7] rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data ?? []}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EDEDED"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#6A6D70' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6A6D70' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  border: '1px solid #EDEDED',
                  borderRadius: 4,
                  fontSize: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                cursor={{ fill: 'rgba(0,112,242,0.06)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="PO"      fill={CHART_COLORS.PO}      name="Purchase Orders" radius={[2, 2, 0, 0]} />
              <Bar dataKey="INVOICE" fill={CHART_COLORS.INVOICE}  name="Invoices"        radius={[2, 2, 0, 0]} />
              <Bar dataKey="ASN"     fill={CHART_COLORS.ASN}      name="ASN"             radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
