import type { MCPTool } from './index.js';

export const createPurchaseOrder: MCPTool = {
  definition: {
    name: 'create_purchase_order',
    description: 'Create a purchase order (PO) and send it to a trading partner. Returns the created PO with reference number.',
    inputSchema: {
      type: 'object',
      properties: {
        receiverTenantId: { type: 'string', description: 'UUID of the receiving partner tenant' },
        currency: { type: 'string', description: 'ISO 4217 currency code (e.g. USD)', default: 'USD' },
        deliveryDate: { type: 'string', description: 'Requested delivery date in ISO 8601 format' },
        paymentTerms: { type: 'string', description: 'Payment terms: NET15, NET30, NET45, NET60, NET90, COD, PREPAID' },
        lineItems: {
          type: 'array',
          description: 'List of line items',
          items: {
            type: 'object',
            properties: {
              lineNumber: { type: 'integer' },
              sku: { type: 'string' },
              description: { type: 'string' },
              quantity: { type: 'number' },
              unit: { type: 'string', description: 'EA, KG, LB, PCS, etc.' },
              unitPrice: { type: 'number' },
              totalPrice: { type: 'number' },
            },
            required: ['lineNumber', 'sku', 'description', 'quantity', 'unit', 'unitPrice', 'totalPrice'],
          },
        },
        deliveryAddress: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip: { type: 'string' },
            country: { type: 'string', description: 'ISO 3166-1 alpha-2' },
          },
          required: ['street', 'city', 'zip', 'country'],
        },
        sendImmediately: { type: 'boolean', description: 'If true, also send the PO immediately (default: false, creates as DRAFT)', default: false },
        notes: { type: 'string' },
        externalRef: { type: 'string', description: 'Your internal order reference number' },
      },
      required: ['receiverTenantId', 'deliveryDate', 'paymentTerms', 'lineItems', 'deliveryAddress'],
    },
  },

  async execute(args, api) {
    const { sendImmediately, ...poData } = args;
    const { data: po } = await api.post('/documents/po', poData);

    if (sendImmediately) {
      await api.post(`/documents/po/${po.id}/send`);
      return { ...po, status: 'SENT', message: `PO ${po.referenceNumber} created and sent to partner.` };
    }

    return { ...po, message: `PO ${po.referenceNumber} created as DRAFT. Call send_po to dispatch it.` };
  },
};
