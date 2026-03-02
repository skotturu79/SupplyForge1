// ══════════════════════════════════════════════════════════════════
// SupplyForge — EDI Utilities
// Supports ANSI X12 (850/810/856/997) and EDIFACT (ORDERS/INVOIC/DESADV)
// ══════════════════════════════════════════════════════════════════

import type { LineItem, Address } from '@supplyforge/types';

// ── X12 Transaction Set Types ─────────────────────────────────────

export type X12TransactionType = '850' | '810' | '856' | '997' | '214';

export interface X12Envelope {
  isaControlNumber: string;
  gsControlNumber: string;
  senderId: string;
  receiverId: string;
  date: string;  // YYMMDD
  time: string;  // HHMM
}

export interface X12_850 {
  poNumber: string;
  poDate: string;         // CCYYMMDD
  currency: string;
  buyerId: string;
  vendorId: string;
  shipToAddress: Address;
  billToAddress: Address;
  requestedDelivery: string;
  lineItems: LineItem[];
  paymentTerms: string;
}

export interface X12_810 {
  invoiceNumber: string;
  invoiceDate: string;
  poReference: string;
  currency: string;
  buyerId: string;
  vendorId: string;
  lineItems: LineItem[];
  taxAmount?: number;
  totalAmount: number;
}

export interface X12_856 {
  shipmentId: string;
  shipDate: string;
  carrier: string;
  trackingNumber?: string;
  poReference: string;
  vendorId: string;
  buyerId: string;
  packages: Array<{
    sscc?: string;
    weight: number;
    weightUnit: 'KG' | 'LB';
    contents: LineItem[];
  }>;
}

// ── X12 Generator ─────────────────────────────────────────────────

let _x12ControlCounter = 1;

function nextControlNumber(width = 9): string {
  return String(_x12ControlCounter++).padStart(width, '0');
}

function x12Date(): string {
  const d = new Date();
  return `${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function x12Time(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}

function buildISA(env: Partial<X12Envelope>, interchangeControlNumber: string): string {
  const sender = (env.senderId || 'SUPPLYFORGE  ').padEnd(15).substring(0, 15);
  const receiver = (env.receiverId || 'PARTNER      ').padEnd(15).substring(0, 15);
  const date = env.date || x12Date();
  const time = env.time || x12Time();
  return `ISA*00*          *00*          *ZZ*${sender}*ZZ*${receiver}*${date}*${time}*^*00501*${interchangeControlNumber.padStart(9, '0')}*0*P*>~`;
}

function buildGS(functionalId: string, senderId: string, receiverId: string, gsControlNumber: string): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const time = x12Time();
  return `GS*${functionalId}*${senderId}*${receiverId}*${date}*${time}*${gsControlNumber}*X*005010~`;
}

/**
 * Generate X12 850 Purchase Order EDI document.
 */
export function generateX12_850(po: X12_850, env: Partial<X12Envelope> = {}): string {
  const icn = nextControlNumber(9);
  const gcn = nextControlNumber(8);
  const tcn = nextControlNumber(9);
  const segments: string[] = [];

  segments.push(buildISA(env, icn));
  segments.push(buildGS('PO', env.senderId || 'SUPPLYFORGE', env.receiverId || 'PARTNER', gcn));

  // ST — Transaction Set Header
  segments.push(`ST*850*${tcn}~`);

  // BEG — Beginning Segment for Purchase Order
  segments.push(`BEG*00*SA*${po.poNumber}**${po.poDate}~`);

  // CUR — Currency
  segments.push(`CUR*BY*${po.currency}~`);

  // DTM — Delivery Date Request
  segments.push(`DTM*002*${po.requestedDelivery}~`);

  // N1/N3/N4 — Ship To
  segments.push(`N1*ST*${po.shipToAddress.city}*ZZ*SHIPTO01~`);
  segments.push(`N3*${po.shipToAddress.street}~`);
  segments.push(`N4*${po.shipToAddress.city}*${po.shipToAddress.state || ''}*${po.shipToAddress.zip}*${po.shipToAddress.country}~`);

  // N1/N3/N4 — Bill To
  segments.push(`N1*BT*${po.billToAddress.city}*ZZ*BILLTO01~`);
  segments.push(`N3*${po.billToAddress.street}~`);
  segments.push(`N4*${po.billToAddress.city}*${po.billToAddress.state || ''}*${po.billToAddress.zip}*${po.billToAddress.country}~`);

  // PO1 — Line Items
  po.lineItems.forEach((item, idx) => {
    segments.push(`PO1*${idx + 1}*${item.quantity}*${item.unit}*${item.unitPrice}**SK*${item.sku}~`);
    segments.push(`PID*F****${item.description.substring(0, 80)}~`);
  });

  // CTT — Transaction Totals
  segments.push(`CTT*${po.lineItems.length}~`);

  // SE — Transaction Set Trailer
  const segCount = segments.length - 2 + 1; // exclude ISA, GS; +1 for SE itself
  segments.push(`SE*${segCount}*${tcn}~`);

  // GE/IEA — Group/Interchange Trailers
  segments.push(`GE*1*${gcn}~`);
  segments.push(`IEA*1*${icn.padStart(9, '0')}~`);

  return segments.join('\n');
}

/**
 * Generate X12 810 Invoice EDI document.
 */
export function generateX12_810(inv: X12_810, env: Partial<X12Envelope> = {}): string {
  const icn = nextControlNumber(9);
  const gcn = nextControlNumber(8);
  const tcn = nextControlNumber(9);
  const segments: string[] = [];

  segments.push(buildISA(env, icn));
  segments.push(buildGS('IN', env.senderId || 'SUPPLYFORGE', env.receiverId || 'PARTNER', gcn));
  segments.push(`ST*810*${tcn}~`);

  // BIG — Beginning Segment for Invoice
  segments.push(`BIG*${inv.invoiceDate}*${inv.invoiceNumber}**${inv.poReference}~`);

  // CUR — Currency
  segments.push(`CUR*SE*${inv.currency}~`);

  // IT1 — Baseline Item Data
  inv.lineItems.forEach((item, idx) => {
    segments.push(`IT1*${idx + 1}*${item.quantity}*${item.unit}*${item.unitPrice}**SK*${item.sku}~`);
    segments.push(`PID*F****${item.description.substring(0, 80)}~`);
  });

  // TDS — Total Monetary Value Summary
  const subtotal = inv.lineItems.reduce((s, i) => s + i.totalPrice, 0);
  segments.push(`TDS*${Math.round(subtotal * 100)}~`);

  // TXI — Tax Information
  if (inv.taxAmount && inv.taxAmount > 0) {
    segments.push(`TXI*TX*${inv.taxAmount.toFixed(2)}~`);
  }

  // CTT
  segments.push(`CTT*${inv.lineItems.length}~`);

  const segCount = segments.length - 2 + 1;
  segments.push(`SE*${segCount}*${tcn}~`);
  segments.push(`GE*1*${gcn}~`);
  segments.push(`IEA*1*${icn.padStart(9, '0')}~`);

  return segments.join('\n');
}

/**
 * Generate X12 997 Functional Acknowledgment.
 */
export function generateX12_997(
  originalGsControlNumber: string,
  originalTransactionType: string,
  accepted: boolean,
  env: Partial<X12Envelope> = {},
): string {
  const icn = nextControlNumber(9);
  const gcn = nextControlNumber(8);
  const tcn = nextControlNumber(9);
  const segments: string[] = [];

  segments.push(buildISA(env, icn));
  segments.push(buildGS('FA', env.senderId || 'SUPPLYFORGE', env.receiverId || 'PARTNER', gcn));
  segments.push(`ST*997*${tcn}~`);

  // AK1 — Functional Group Response Header
  segments.push(`AK1*${originalTransactionType.slice(0, 2)}*${originalGsControlNumber}~`);

  // AK9 — Functional Group Response Trailer
  const ackCode = accepted ? 'A' : 'R';
  segments.push(`AK9*${ackCode}*1*1*${accepted ? 1 : 0}~`);

  const segCount = segments.length - 2 + 1;
  segments.push(`SE*${segCount}*${tcn}~`);
  segments.push(`GE*1*${gcn}~`);
  segments.push(`IEA*1*${icn.padStart(9, '0')}~`);

  return segments.join('\n');
}

// ── X12 Parser ────────────────────────────────────────────────────

export interface ParsedX12 {
  type: X12TransactionType;
  envelope: X12Envelope;
  segments: Record<string, string[][]>;
  raw: string[][];
}

/**
 * Parse a raw X12 EDI string into a structured object.
 * Supports both ~ and \n segment terminators.
 */
export function parseX12(raw: string): ParsedX12 {
  // Detect element separator from ISA (position 3) and segment terminator
  const elementSep = raw[3] || '*';
  const segTerminator = raw.indexOf('~') !== -1 ? '~' : '\n';

  const segStrings = raw
    .split(segTerminator)
    .map((s) => s.trim())
    .filter(Boolean);

  const rawSegments = segStrings.map((s) => s.split(elementSep));

  const envelope: X12Envelope = {
    isaControlNumber: '',
    gsControlNumber: '',
    senderId: '',
    receiverId: '',
    date: '',
    time: '',
  };

  let transactionType: X12TransactionType = '850';
  const segmentsMap: Record<string, string[][]> = {};

  for (const seg of rawSegments) {
    const id = seg[0];
    if (!segmentsMap[id]) segmentsMap[id] = [];
    segmentsMap[id].push(seg);

    if (id === 'ISA') {
      envelope.senderId = seg[6]?.trim() || '';
      envelope.receiverId = seg[8]?.trim() || '';
      envelope.date = seg[9] || '';
      envelope.time = seg[10] || '';
      envelope.isaControlNumber = seg[13] || '';
    }
    if (id === 'GS') {
      envelope.gsControlNumber = seg[6] || '';
    }
    if (id === 'ST') {
      transactionType = (seg[1] || '850') as X12TransactionType;
    }
  }

  return { type: transactionType, envelope, segments: segmentsMap, raw: rawSegments };
}

// ── EDIFACT Generator ─────────────────────────────────────────────

let _edifactMsgRef = 1;

/**
 * Generate a UN/EDIFACT ORDERS message (D96A standard).
 */
export function generateEDIFACT_ORDERS(po: X12_850, senderId: string, receiverId: string): string {
  const msgRef = String(_edifactMsgRef++).padStart(6, '0');
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const time = `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

  const segs: string[] = [];

  // UNB — Interchange Header
  segs.push(`UNB+UNOA:2+${senderId}:14+${receiverId}:14+${date}:${time}+${msgRef}'`);

  // UNH — Message Header
  segs.push(`UNH+${msgRef}+ORDERS:D:96A:UN'`);

  // BGM — Beginning of Message
  segs.push(`BGM+220+${po.poNumber}+9'`);

  // DTM — Date/Time
  segs.push(`DTM+137:${po.poDate}:102'`);
  segs.push(`DTM+2:${po.requestedDelivery}:102'`);

  // CUX — Currencies
  segs.push(`CUX+2:${po.currency}:9'`);

  // NAD — Name and Address (Ship To)
  segs.push(`NAD+ST+++${po.shipToAddress.street}:${po.shipToAddress.city}++${po.shipToAddress.zip}+${po.shipToAddress.country}'`);

  // LIN + QTY + PRI — Line Items
  po.lineItems.forEach((item, idx) => {
    segs.push(`LIN+${idx + 1}++${item.sku}:SA'`);
    segs.push(`IMD+F++:::${item.description.substring(0, 70)}'`);
    segs.push(`QTY+21:${item.quantity}:${item.unit}'`);
    segs.push(`PRI+AAB:${item.unitPrice.toFixed(2)}'`);
  });

  // UNS — Section Control
  segs.push(`UNS+S'`);

  // MOA — Total
  const total = po.lineItems.reduce((s, i) => s + i.totalPrice, 0);
  segs.push(`MOA+79:${total.toFixed(2)}'`);

  // UNT — Message Trailer
  segs.push(`UNT+${segs.length}+${msgRef}'`);

  // UNZ — Interchange Trailer
  segs.push(`UNZ+1+${msgRef}'`);

  return segs.join('\n');
}

/**
 * Generate UN/EDIFACT INVOIC message (D96A).
 */
export function generateEDIFACT_INVOIC(inv: X12_810, senderId: string, receiverId: string): string {
  const msgRef = String(_edifactMsgRef++).padStart(6, '0');
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const time = `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

  const segs: string[] = [];

  segs.push(`UNB+UNOA:2+${senderId}:14+${receiverId}:14+${date}:${time}+${msgRef}'`);
  segs.push(`UNH+${msgRef}+INVOIC:D:96A:UN'`);

  // BGM — Beginning of Message (380 = Commercial invoice)
  segs.push(`BGM+380+${inv.invoiceNumber}+9'`);

  segs.push(`DTM+137:${inv.invoiceDate}:102'`);
  segs.push(`RFF+ON:${inv.poReference}'`);
  segs.push(`CUX+2:${inv.currency}:9'`);

  inv.lineItems.forEach((item, idx) => {
    segs.push(`LIN+${idx + 1}++${item.sku}:SA'`);
    segs.push(`IMD+F++:::${item.description.substring(0, 70)}'`);
    segs.push(`QTY+47:${item.quantity}:${item.unit}'`);
    segs.push(`PRI+AAA:${item.unitPrice.toFixed(2)}'`);
    segs.push(`MOA+203:${item.totalPrice.toFixed(2)}'`);
  });

  segs.push(`UNS+S'`);

  if (inv.taxAmount && inv.taxAmount > 0) {
    segs.push(`TAX+7+VAT+++:::0+S'`);
    segs.push(`MOA+124:${inv.taxAmount.toFixed(2)}'`);
  }

  segs.push(`MOA+77:${inv.totalAmount.toFixed(2)}'`);

  segs.push(`UNT+${segs.length}+${msgRef}'`);
  segs.push(`UNZ+1+${msgRef}'`);

  return segs.join('\n');
}

// ── EDI Format Detection ───────────────────────────────────────────

export type EDIFormat = 'X12' | 'EDIFACT' | 'UNKNOWN';

export function detectEDIFormat(raw: string): EDIFormat {
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('ISA')) return 'X12';
  if (trimmed.startsWith('UNB')) return 'EDIFACT';
  return 'UNKNOWN';
}
