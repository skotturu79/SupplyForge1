import type { MCPTool } from './index.js';

export const matchInvoiceToPo: MCPTool = {
  definition: {
    name: 'match_invoice_to_po',
    description: 'Perform 3-way match between an invoice and a purchase order. Returns match status (MATCHED, PARTIAL, DISCREPANCY) with details. Can also use AI to suggest the best matching PO.',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'UUID of the invoice document' },
        poReference: { type: 'string', description: 'PO reference number to match against (optional — omit to use AI suggestion)' },
        useAi: { type: 'boolean', description: 'Use AI to suggest the best matching PO if no poReference given', default: false },
      },
      required: ['invoiceId'],
    },
  },

  async execute(args, api) {
    const { invoiceId, poReference, useAi } = args as { invoiceId: string; poReference?: string; useAi?: boolean };

    if (!poReference && useAi) {
      // Use AI suggestion
      const { data: suggestion } = await api.post(`/ai/invoice/${invoiceId}/suggest-match`);
      if (suggestion.bestMatchId) {
        // Now perform actual match using the suggested PO
        const { data: matchResult } = await api.post(`/documents/invoice/${invoiceId}/match`, {
          poReference: suggestion.bestMatchId,
        });
        return {
          ...matchResult,
          aiSuggestion: suggestion,
          summary: `AI-assisted match: Invoice vs PO — ${matchResult.status}. AI confidence: ${(suggestion.confidence * 100).toFixed(0)}%. ${suggestion.reasoning}`,
        };
      }
      return { status: 'PENDING', aiSuggestion: suggestion, summary: 'AI could not identify a confident PO match.' };
    }

    if (!poReference) {
      return { error: 'Provide either poReference or set useAi=true' };
    }

    const { data: result } = await api.post(`/documents/invoice/${invoiceId}/match`, { poReference });

    const statusMessages = {
      MATCHED: 'Perfect match — amounts and currency align.',
      PARTIAL: 'Partial match — minor discrepancy within 5% tolerance.',
      DISCREPANCY: 'Discrepancy detected — manual review required.',
      PENDING: 'Match could not be completed — check document availability.',
    };

    return {
      ...result,
      summary: `3-Way Match Result: ${result.status}. ${statusMessages[result.status as keyof typeof statusMessages] || ''} PO Total: ${result.details?.poTotal}, Invoice Total: ${result.details?.invTotal}, Currency: ${result.details?.currency}`,
    };
  },
};
