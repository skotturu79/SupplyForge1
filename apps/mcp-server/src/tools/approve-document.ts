import type { MCPTool } from './index.js';

export const approveDocument: MCPTool = {
  definition: {
    name: 'approve_document',
    description: 'Acknowledge, accept, or reject a document (PO, invoice, ASN) on behalf of the authenticated tenant.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'UUID of the document to act on' },
        action: { type: 'string', enum: ['acknowledge', 'accept', 'reject'], description: 'Action to take' },
        comment: { type: 'string', description: 'Optional comment or rejection reason (required for reject)' },
      },
      required: ['documentId', 'action'],
    },
  },

  async execute(args, api) {
    const { documentId, action, comment } = args as { documentId: string; action: string; comment?: string };

    if (action === 'reject' && !comment) {
      return { error: 'A rejection reason (comment) is required when rejecting a document.' };
    }

    const endpoint = `/documents/${documentId}/${action}`;
    const body = comment ? { comment, reason: comment } : {};

    const { data } = await api.patch(endpoint, body);

    const actionPast = { acknowledge: 'acknowledged', accept: 'accepted', reject: 'rejected' }[action] || action;

    return {
      id: data.id,
      referenceNumber: data.referenceNumber,
      status: data.status,
      summary: `Document ${data.referenceNumber} has been ${actionPast}. New status: ${data.status}.`,
    };
  },
};
