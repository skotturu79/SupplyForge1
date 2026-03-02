import type { AxiosInstance } from 'axios';

export interface MCPTool {
  definition: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  };
  execute(args: Record<string, unknown>, api: AxiosInstance): Promise<unknown>;
}

import { createPurchaseOrder } from './create-purchase-order.js';
import { getDocumentStatus } from './get-document-status.js';
import { trackShipment } from './track-shipment.js';
import { matchInvoiceToPo } from './match-invoice-to-po.js';
import { searchDocuments } from './search-documents.js';
import { generateLabel } from './generate-label.js';
import { vendorPerformance } from './vendor-performance.js';
import { approveDocument } from './approve-document.js';

export const tools: Record<string, MCPTool> = {
  create_purchase_order: createPurchaseOrder,
  get_document_status: getDocumentStatus,
  track_shipment: trackShipment,
  match_invoice_to_po: matchInvoiceToPo,
  search_documents: searchDocuments,
  generate_label: generateLabel,
  vendor_performance: vendorPerformance,
  approve_document: approveDocument,
};
