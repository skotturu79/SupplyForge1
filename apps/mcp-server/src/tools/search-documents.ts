import type { MCPTool } from './index.js';

export const searchDocuments: MCPTool = {
  definition: {
    name: 'search_documents',
    description: 'Search SupplyForge documents by type, status, partner, date range, or amount.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Document type: PO, INVOICE, ASN, DELIVERY_NOTE, LABEL, BOL' },
        status: { type: 'string', description: 'Document status: DRAFT, SENT, ACKNOWLEDGED, ACCEPTED, REJECTED, CANCELLED, PAID' },
        partnerId: { type: 'string', description: 'Filter by partner tenant UUID' },
        from: { type: 'string', description: 'Start date ISO 8601' },
        to: { type: 'string', description: 'End date ISO 8601' },
        q: { type: 'string', description: 'Free-text search' },
        minAmount: { type: 'number' },
        maxAmount: { type: 'number' },
        currency: { type: 'string' },
        limit: { type: 'integer', default: 10 },
      },
    },
  },

  async execute(args, api) {
    const { data } = await api.get('/documents', { params: { ...args, limit: args.limit || 10 } });

    return {
      total: data.meta?.total,
      count: data.data?.length,
      documents: data.data?.map((d: Record<string, unknown>) => ({
        id: d.id,
        type: d.type,
        status: d.status,
        referenceNumber: d.referenceNumber,
        totalAmount: d.totalAmount,
        currency: d.currency,
        createdAt: d.createdAt,
      })),
      summary: `Found ${data.meta?.total} document(s) matching criteria. Showing ${data.data?.length}.`,
    };
  },
};
