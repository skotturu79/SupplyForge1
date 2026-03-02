import type { MCPTool } from './index.js';

export const getDocumentStatus: MCPTool = {
  definition: {
    name: 'get_document_status',
    description: 'Get the current status and details of any SupplyForge document (PO, invoice, ASN, etc.) by its ID or reference number.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'UUID of the document' },
        referenceNumber: { type: 'string', description: 'Document reference number (e.g. PO-ABC123)' },
      },
      oneOf: [{ required: ['documentId'] }, { required: ['referenceNumber'] }],
    },
  },

  async execute(args, api) {
    let docId = args.documentId as string;

    if (!docId && args.referenceNumber) {
      // Search by reference number
      const { data } = await api.get('/documents', { params: { q: args.referenceNumber, limit: 5 } });
      const match = data.data?.find((d: { referenceNumber: string }) => d.referenceNumber === args.referenceNumber);
      if (!match) return { error: `No document found with reference: ${args.referenceNumber}` };
      docId = match.id;
    }

    const { data: doc } = await api.get(`/documents/${docId}`);
    const { data: events } = await api.get(`/documents/${docId}/events`);

    return {
      id: doc.id,
      type: doc.type,
      status: doc.status,
      referenceNumber: doc.referenceNumber,
      currency: doc.currency,
      totalAmount: doc.totalAmount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      acknowledgedAt: doc.acknowledgedAt,
      processedAt: doc.processedAt,
      recentEvents: events.slice(0, 5),
      summary: `${doc.type} ${doc.referenceNumber} is currently ${doc.status}. Total: ${doc.currency} ${doc.totalAmount?.toLocaleString() ?? 'N/A'}.`,
    };
  },
};
