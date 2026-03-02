import type { MCPTool } from './index.js';

export const generateLabel: MCPTool = {
  definition: {
    name: 'generate_label',
    description: 'Generate a shipping label via FedEx, UPS, or DHL API.',
    inputSchema: {
      type: 'object',
      properties: {
        carrier: { type: 'string', description: 'FEDEX, UPS, DHL, USPS' },
        service: { type: 'string', description: 'Carrier service code (e.g. FEDEX_GROUND, UPS_GROUND)' },
        labelFormat: { type: 'string', enum: ['PDF', 'ZPL', 'PNG'], default: 'PDF' },
        fromAddress: {
          type: 'object',
          properties: { street: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' }, zip: { type: 'string' }, country: { type: 'string' } },
          required: ['street', 'city', 'zip', 'country'],
        },
        toAddress: {
          type: 'object',
          properties: { street: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' }, zip: { type: 'string' }, country: { type: 'string' } },
          required: ['street', 'city', 'zip', 'country'],
        },
        weight: { type: 'number', description: 'Package weight' },
        weightUnit: { type: 'string', enum: ['LB', 'KG'], default: 'LB' },
        signatureRequired: { type: 'boolean', default: false },
      },
      required: ['carrier', 'service', 'fromAddress', 'toAddress', 'weight'],
    },
  },

  async execute(args, api) {
    const { carrier, ...labelData } = args as { carrier: string } & Record<string, unknown>;
    const { data } = await api.post(`/carriers/${carrier}/labels`, labelData);

    return {
      trackingNumber: data.trackingNumber,
      labelUrl: data.labelUrl,
      carrier: carrier.toUpperCase(),
      summary: `Label generated for ${carrier.toUpperCase()}. Tracking: ${data.trackingNumber}. Download: ${data.labelUrl}`,
    };
  },
};
