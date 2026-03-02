import { ok, buildTrendData } from '../../_mock/data';

export async function GET() {
  const trend = buildTrendData();
  return ok({
    kpis: {
      totalDocuments:       127,
      totalInvoiceValue:    284600,
      activePartners:       6,
      avgProcessingHours:   4.2,
    },
    volumeByDay: trend.map(d => ({ date: d.date, count: d.PO + d.INVOICE + d.ASN })),
    byType: [
      { type: 'PO',      count: 52 },
      { type: 'INVOICE', count: 41 },
      { type: 'ASN',     count: 25 },
      { type: 'BOL',     count: 6  },
      { type: 'LABEL',   count: 3  },
    ],
    topPartners: [
      { name: 'GlobalParts Ltd.',   documents: 68, invoiceValue: 198400, lastActivity: '2026-02-21T12:00:00Z' },
      { name: 'FastShip Logistics', documents: 31, invoiceValue: 48200,  lastActivity: '2026-02-20T07:35:00Z' },
      { name: 'PrecisionCast Inc.', documents: 12, invoiceValue: 38000,  lastActivity: '2026-01-22T10:00:00Z' },
    ],
    matchRate: { matched: 36, disputed: 3, pending: 2 },
  });
}
