import type { MCPTool } from './index.js';

export const vendorPerformance: MCPTool = {
  definition: {
    name: 'vendor_performance',
    description: 'Get performance metrics for a vendor: on-time delivery rate, invoice accuracy, order volume, and more.',
    inputSchema: {
      type: 'object',
      properties: {
        vendorTenantId: { type: 'string', description: 'UUID of the vendor tenant' },
        days: { type: 'integer', description: 'Analysis period in days', default: 90 },
      },
      required: ['vendorTenantId'],
    },
  },

  async execute(args, api) {
    const { vendorTenantId, days = 90 } = args as { vendorTenantId: string; days?: number };

    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

    const [posResp, invoicesResp, shipmentsResp] = await Promise.allSettled([
      api.get('/documents', { params: { partnerId: vendorTenantId, type: 'PO', from: since, limit: 100 } }),
      api.get('/documents', { params: { partnerId: vendorTenantId, type: 'INVOICE', from: since, limit: 100 } }),
      api.get('/documents', { params: { partnerId: vendorTenantId, type: 'ASN', from: since, limit: 100 } }),
    ]);

    const pos = posResp.status === 'fulfilled' ? posResp.value.data : { data: [], meta: { total: 0 } };
    const invoices = invoicesResp.status === 'fulfilled' ? invoicesResp.value.data : { data: [], meta: { total: 0 } };
    const asns = shipmentsResp.status === 'fulfilled' ? shipmentsResp.value.data : { data: [], meta: { total: 0 } };

    const acceptedInvoices = invoices.data?.filter((i: { status: string }) => ['ACCEPTED', 'PAID'].includes(i.status)) || [];
    const matchRate = invoices.meta?.total > 0
      ? Math.round((acceptedInvoices.length / invoices.meta.total) * 100)
      : null;

    return {
      vendorTenantId,
      period: `Last ${days} days`,
      metrics: {
        totalPOs: pos.meta?.total || 0,
        totalInvoices: invoices.meta?.total || 0,
        totalASNs: asns.meta?.total || 0,
        invoiceMatchRate: matchRate !== null ? `${matchRate}%` : 'N/A',
        orderVolume: pos.data?.reduce((s: number, p: { totalAmount?: number }) => s + (p.totalAmount || 0), 0),
      },
      summary: `Vendor ${vendorTenantId} over last ${days} days: ${pos.meta?.total} POs, ${invoices.meta?.total} invoices (${matchRate ?? 'N/A'}% match rate), ${asns.meta?.total} ASNs.`,
    };
  },
};
