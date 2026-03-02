'use client';

import React from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
export type LabelType = 'SHIPPING' | 'PALLET' | 'HU' | 'BOX';

export interface Address {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

export interface LabelData {
  type: LabelType;
  id?: string;
  rateCharged?: number;
  createdAt?: string;

  // ── Shipping ─────────────────────────────────────────────────────
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  labelFormat?: string;
  isReturn?: boolean;
  signatureRequired?: boolean;
  shipDate?: string;
  estimatedDelivery?: string;

  // ── Addresses (shared) ───────────────────────────────────────────
  fromAddress?: Address;
  toAddress?: Address;

  // ── Package (shipping / box) ─────────────────────────────────────
  weight?: number;
  weightUnit?: string;
  dimensions?: { l?: number; w?: number; h?: number; unit?: string } | null;
  referenceNumber?: string | null;
  orderId?: string | null;
  sscc?: string | null;

  // ── Shared identifiers ───────────────────────────────────────────
  batchNumber?: string;
  lotNumber?: string;

  // ── Pallet ───────────────────────────────────────────────────────
  content?: string;
  grossWeight?: number;
  grossWeightUnit?: string;
  units?: number;
  unitsType?: string;
  productionDate?: string;
  expiryDate?: string;

  // ── Handling Unit ────────────────────────────────────────────────
  huNumber?: string;
  materialNumber?: string;
  materialDescription?: string;
  quantity?: number;
  quantityUnit?: string;
  deliveryNumber?: string;
  plant?: string;
  storageLocation?: string;

  // ── Box / Carton ─────────────────────────────────────────────────
  cartonNumber?: number;
  totalCartons?: number;
  contents?: string;
  qtyPerCarton?: number;
  qtyUnit?: string;
}

// ── Dimensions per label type ─────────────────────────────────────────────────
export const LABEL_DIMS: Record<LabelType, { W: number; H: number; printW: string; printH: string }> = {
  SHIPPING: { W: 432, H: 288, printW: '6in', printH: '4in' },
  PALLET:   { W: 360, H: 504, printW: '5in', printH: '7in' },
  HU:       { W: 432, H: 288, printW: '6in', printH: '4in' },
  BOX:      { W: 288, H: 288, printW: '4in', printH: '4in' },
};

// ── Carrier brand colours ─────────────────────────────────────────────────────
const CARRIER_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  FEDEX: { bg: '#4D148C', text: '#FFFFFF', accent: '#FF6200' },
  UPS:   { bg: '#351C15', text: '#FFFFFF', accent: '#FFB500' },
  DHL:   { bg: '#FECC00', text: '#D40511', accent: '#D40511' },
  USPS:  { bg: '#003087', text: '#FFFFFF', accent: '#E21836' },
};

// ── Barcode (deterministic Code-128-style) ────────────────────────────────────
function Barcode({
  value,
  width = 280,
  height = 48,
}: {
  value: string;
  width?: number;
  height?: number;
}) {
  const bars: { w: number; black: boolean }[] = [];
  // Guard: START
  bars.push({ w: 1.5, black: true }, { w: 1, black: false }, { w: 1.5, black: true }, { w: 0.8, black: false });
  for (let i = 0; i < Math.min(value.length, 26); i++) {
    const c = value.charCodeAt(i);
    bars.push(
      { w: ((c >> 5) % 3) + 1, black: true },
      { w: ((c >> 3) % 2) + 1, black: false },
      { w: ((c >> 1) % 3) + 1, black: true },
      { w: (c % 2)       + 1, black: false },
    );
  }
  // Guard: STOP
  bars.push({ w: 1.5, black: true }, { w: 0.8, black: false }, { w: 1.5, black: true }, { w: 2, black: true });

  const totalUnits = bars.reduce((s, b) => s + b.w, 0);
  const unitW = width / totalUnits;
  let x = 0;
  const rects: React.ReactElement[] = [];
  bars.forEach((b, i) => {
    const bw = b.w * unitW;
    if (b.black) rects.push(<rect key={i} x={x} y={0} width={bw} height={height} fill="#000" />);
    x += bw;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x={0} y={0} width={width} height={height} fill="#fff" />
      {rects}
    </svg>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function addrLines(a?: Address): string[] {
  if (!a) return [];
  return [
    a.name ?? '',
    a.street ?? '',
    [a.city, a.state].filter(Boolean).join(', '),
    [a.zip, a.country].filter(Boolean).join(' '),
  ].filter(Boolean);
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── SHIPPING LABEL ────────────────────────────────────────────────────────────
function ShippingLabelSVG({ d }: { d: LabelData }) {
  const { W, H } = LABEL_DIMS.SHIPPING;
  const c = CARRIER_COLORS[d.carrier?.toUpperCase() ?? ''] ?? { bg: '#374151', text: '#FFF', accent: '#9CA3AF' };
  const from = addrLines(d.fromAddress);
  const to   = addrLines(d.toAddress);
  const svc  = (d.service ?? '').split('_').slice(-2).join(' ');
  const wStr = d.weight != null ? `${d.weight} ${d.weightUnit ?? 'LB'}` : '';
  const dStr = d.dimensions ? `${d.dimensions.l}×${d.dimensions.w}×${d.dimensions.h} ${d.dimensions.unit ?? ''}` : '';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ fontFamily: 'monospace', display: 'block' }}>
      {/* bg */}
      <rect x={0} y={0} width={W} height={H} fill="#fff" stroke="#D1D5DB" strokeWidth={1} rx={4} />

      {/* carrier header */}
      <rect x={0} y={0} width={W} height={40} fill={c.bg} rx={4} />
      <rect x={0} y={22} width={W} height={18} fill={c.bg} />
      <text x={14} y={27} fill={c.text} fontSize={20} fontWeight="bold" letterSpacing={3}>{d.carrier ?? 'CARRIER'}</text>
      <text x={W - 14} y={27} fill={c.accent} fontSize={11} fontWeight="bold" textAnchor="end">{svc}</text>
      {d.isReturn && (
        <text x={W - 14} y={13} fill={c.accent} fontSize={9} fontWeight="bold" textAnchor="end">RETURN</text>
      )}
      {d.signatureRequired && (
        <text x={14} y={52} fill="#B91C1C" fontSize={8} fontWeight="bold">★ SIGNATURE REQUIRED</text>
      )}

      {/* FROM */}
      <text x={14} y={d.signatureRequired ? 65 : 56} fill="#6B7280" fontSize={7} fontWeight="bold" letterSpacing={1}>FROM</text>
      {from.map((l, i) => (
        <text key={i} x={14} y={(d.signatureRequired ? 75 : 66) + i * 11}
          fill="#111827" fontSize={i === 0 ? 9 : 8} fontWeight={i === 0 ? 'bold' : 'normal'}>{l}</text>
      ))}

      <line x1={14} y1={122} x2={W - 14} y2={122} stroke="#E5E7EB" strokeWidth={1} />

      {/* TO */}
      <text x={14} y={134} fill="#6B7280" fontSize={7} fontWeight="bold" letterSpacing={1}>SHIP TO</text>
      {to.map((l, i) => (
        <text key={i} x={14} y={145 + i * 13}
          fill="#111827" fontSize={i === 0 ? 12 : 10} fontWeight={i === 0 ? 'bold' : 'normal'}>{l}</text>
      ))}

      {/* right meta panel */}
      <rect x={W - 130} y={46} width={116} height={78} fill="#F9FAFB" rx={3} />
      {[
        ['SHIP DATE',     fmtDate(d.shipDate)],
        ['EST. DELIVERY', fmtDate(d.estimatedDelivery)],
        ['WEIGHT',        wStr + (dStr ? ` / ${dStr}` : '')],
        d.referenceNumber ? ['REF #', d.referenceNumber] : null,
      ].filter(Boolean).map((row, i) => (
        <g key={i}>
          <text x={W - 124} y={58 + i * 20} fill="#9CA3AF" fontSize={7} fontWeight="bold">{(row as string[])[0]}</text>
          <text x={W - 124} y={68 + i * 20} fill="#111827" fontSize={8}>{(row as string[])[1]}</text>
        </g>
      ))}

      {/* barcode */}
      <line x1={14} y1={212} x2={W - 14} y2={212} stroke="#E5E7EB" strokeWidth={1} />
      <g transform={`translate(${(W - 280) / 2}, 218)`}>
        <Barcode value={d.trackingNumber ?? 'PREVIEW'} width={280} height={42} />
      </g>
      <text x={W / 2} y={272} fill="#111827" fontSize={11} textAnchor="middle" letterSpacing={3} fontWeight="bold">
        {d.trackingNumber ?? 'PREVIEW-ONLY'}
      </text>
      {d.sscc && (
        <text x={W / 2} y={283} fill="#9CA3AF" fontSize={7} textAnchor="middle">SSCC: {d.sscc}</text>
      )}
    </svg>
  );
}

// ── PALLET LABEL ──────────────────────────────────────────────────────────────
function PalletLabelSVG({ d }: { d: LabelData }) {
  const { W, H } = LABEL_DIMS.PALLET;
  const to   = addrLines(d.toAddress);
  const from = addrLines(d.fromAddress);
  const sscc = d.sscc ?? '000000000000000000';
  // Format SSCC as "(00) X XXXXXXXX XXXXXXXXX X"
  const ssccFmt = sscc.length === 18
    ? `(00) ${sscc[0]} ${sscc.slice(1, 9)} ${sscc.slice(9, 17)} ${sscc[17]}`
    : sscc;

  const rows: [string, string, string, string][] = [
    ['CONTENT / DESCRIPTION', d.content ?? '—', 'GROSS WEIGHT', `${d.grossWeight ?? '—'} ${d.grossWeightUnit ?? 'KG'}`],
    ['NO. OF HANDLING UNITS', `${d.units ?? '—'}`, 'HU TYPE', d.unitsType ?? '—'],
    ['BATCH / LOT NUMBER', d.batchNumber ?? d.lotNumber ?? '—', 'PROD. DATE', fmtDate(d.productionDate)],
  ];
  if (d.expiryDate) {
    rows.push(['EXPIRY DATE', fmtDate(d.expiryDate), 'PO REFERENCE', d.referenceNumber ?? '—']);
  }

  const bodyY = 130; // start of grid after address section
  const rowH  = 36;
  const gridH = rows.length * rowH;
  const barcodeY = bodyY + gridH + 8;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ fontFamily: 'monospace', display: 'block' }}>
      {/* bg */}
      <rect x={0} y={0} width={W} height={H} fill="#fff" stroke="#D1D5DB" strokeWidth={1} rx={4} />

      {/* header */}
      <rect x={0} y={0} width={W} height={28} fill="#374151" rx={4} />
      <rect x={0} y={18} width={W} height={10} fill="#374151" />
      <text x={12} y={19} fill="#fff" fontSize={11} fontWeight="bold" letterSpacing={2}>GS1 PALLET LABEL</text>
      <text x={W - 12} y={19} fill="#9CA3AF" fontSize={9} textAnchor="end" letterSpacing={1}>SSCC-18</text>

      {/* SHIP TO block – blue left accent */}
      <rect x={0} y={28} width={4} height={90} fill="#0070F2" />
      <text x={14} y={43} fill="#0070F2" fontSize={8} fontWeight="bold" letterSpacing={1}>SHIP TO</text>
      {to.map((l, i) => (
        <text key={i} x={14} y={54 + i * 14}
          fill="#111827" fontSize={i === 0 ? 13 : 10} fontWeight={i === 0 ? 'bold' : 'normal'}>{l}</text>
      ))}

      {/* FROM + PO in two columns */}
      <rect x={0} y={118} width={W} height={12} fill="#F3F4F6" />
      <text x={12} y={127} fill="#374151" fontSize={7} fontWeight="bold" letterSpacing={1}>FROM</text>
      <text x={W / 2} y={127} fill="#374151" fontSize={7} fontWeight="bold" letterSpacing={1}>PO REFERENCE</text>

      <text x={12} y={140} fill="#111827" fontSize={9} fontWeight="bold">{from[0] ?? '—'}</text>
      <text x={12} y={151} fill="#6B7280" fontSize={8}>{[from[2], from[3]].filter(Boolean).join(' ')}</text>
      <text x={W / 2} y={140} fill="#111827" fontSize={11} fontWeight="bold">{d.referenceNumber ?? '—'}</text>

      {/* data grid */}
      {rows.map(([lA, vA, lB, vB], ri) => {
        const y0 = bodyY + 18 + ri * rowH;
        const y  = bodyY + ri * rowH;
        return (
          <g key={ri}>
            <line x1={0} y1={y + 18} x2={W} y2={y + 18} stroke="#E5E7EB" strokeWidth={1} />
            <rect x={0} y={y + 18} width={W} height={18} fill={ri % 2 === 0 ? '#F9FAFB' : '#fff'} />
            {/* left label */}
            <text x={12} y={y + 18 + 10} fill="#9CA3AF" fontSize={7} fontWeight="bold" letterSpacing={1}>{lA}</text>
            <text x={12} y={y + 18 + 10 + 11} fill="#111827" fontSize={9} fontWeight="600">{vA}</text>
            {/* right label */}
            <rect x={W / 2} y={y + 18} width={1} height={rowH} fill="#E5E7EB" />
            <text x={W / 2 + 8} y={y + 18 + 10} fill="#9CA3AF" fontSize={7} fontWeight="bold" letterSpacing={1}>{lB}</text>
            <text x={W / 2 + 8} y={y + 18 + 10 + 11} fill="#111827" fontSize={9} fontWeight="600">{vB}</text>
          </g>
        );
      })}

      {/* SSCC barcode */}
      <line x1={0} y1={barcodeY + 4} x2={W} y2={barcodeY + 4} stroke="#E5E7EB" strokeWidth={1} />
      <text x={12} y={barcodeY + 14} fill="#9CA3AF" fontSize={7} fontWeight="bold" letterSpacing={1}>SERIAL SHIPPING CONTAINER CODE (SSCC-18)</text>
      <g transform={`translate(${(W - 312) / 2}, ${barcodeY + 20})`}>
        <Barcode value={sscc} width={312} height={52} />
      </g>
      <text x={W / 2} y={barcodeY + 86} fill="#111827" fontSize={9} textAnchor="middle" letterSpacing={2} fontWeight="bold">
        {ssccFmt}
      </text>
    </svg>
  );
}

// ── HU (HANDLING UNIT) LABEL ──────────────────────────────────────────────────
function HULabelSVG({ d }: { d: LabelData }) {
  const { W, H } = LABEL_DIMS.HU;
  const huRef = d.huNumber ?? 'HU-PREVIEW';
  const from  = d.fromAddress?.name ?? '—';

  const cells: [string, string, number, number, number, number][] = [
    // [label, value, x, y, w, textSize]
    ['MATERIAL NO.',     d.materialNumber ?? '—',         14,  60, 140, 10],
    ['DESCRIPTION',      d.materialDescription ?? '—',   160,  60, 258,  9],
    ['QUANTITY',         `${d.quantity ?? '—'}`,           14, 102,  80, 14],
    ['UNIT',             d.quantityUnit ?? '—',           100, 102,  60, 14],
    ['BATCH / LOT',      d.batchNumber ?? d.lotNumber ?? '—', 166, 102, 252, 10],
    ['DELIVERY NO.',     d.deliveryNumber ?? '—',          14, 144, 140, 10],
    ['PLANT',            d.plant ?? '—',                  160, 144,  80, 10],
    ['STORAGE LOC.',     d.storageLocation ?? '—',        246, 144, 172, 10],
    ['CUSTOMER PO',      d.referenceNumber ?? '—',         14, 186, 140, 10],
    ['VENDOR',           from,                            160, 186, 258,  9],
  ];

  const gridLines = [
    // horizontal
    { x1: 0, y1: 46,  x2: W, y2: 46  },
    { x1: 0, y1: 88,  x2: W, y2: 88  },
    { x1: 0, y1: 130, x2: W, y2: 130 },
    { x1: 0, y1: 172, x2: W, y2: 172 },
    { x1: 0, y1: 210, x2: W, y2: 210 },
    // vertical
    { x1: 154, y1: 46, x2: 154, y2: 210 },
    { x1: 94,  y1: 88, x2: 94,  y2: 130 },
    { x1: 160, y1: 130, x2: 160, y2: 172 },
    { x1: 240, y1: 130, x2: 240, y2: 172 },
    { x1: 154, y1: 172, x2: 154, y2: 210 },
  ];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ fontFamily: 'monospace', display: 'block' }}>
      {/* bg */}
      <rect x={0} y={0} width={W} height={H} fill="#fff" stroke="#D1D5DB" strokeWidth={1} rx={4} />

      {/* header */}
      <rect x={0} y={0} width={W} height={44} fill="#0070F2" rx={4} />
      <rect x={0} y={24} width={W} height={20} fill="#0070F2" />
      <text x={14} y={28} fill="#fff" fontSize={13} fontWeight="bold" letterSpacing={2}>HANDLING UNIT</text>
      <text x={W - 14} y={28} fill="#E0F0FF" fontSize={10} fontWeight="bold" textAnchor="end">{huRef}</text>

      {/* to address compact */}
      <text x={14} y={41} fill="#BFDBFE" fontSize={7} letterSpacing={1}>
        TO: {[d.toAddress?.name, d.toAddress?.city, d.toAddress?.country].filter(Boolean).join(' • ')}
      </text>

      {/* grid lines */}
      {gridLines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#E5E7EB" strokeWidth={0.8} />
      ))}

      {/* data cells */}
      {cells.map(([label, value, x, y, , textSize]) => (
        <g key={label}>
          <text x={x} y={y + 11} fill="#9CA3AF" fontSize={7} fontWeight="bold" letterSpacing={0.8}>{label}</text>
          <text x={x} y={y + 22} fill="#111827" fontSize={textSize} fontWeight="700">{value}</text>
        </g>
      ))}

      {/* barcode */}
      <g transform={`translate(${(W - 380) / 2}, 216)`}>
        <Barcode value={huRef} width={380} height={42} />
      </g>
      <text x={W / 2} y={270} fill="#111827" fontSize={9} textAnchor="middle" letterSpacing={2} fontWeight="bold">
        {huRef}
      </text>
    </svg>
  );
}

// ── BOX / CARTON LABEL ────────────────────────────────────────────────────────
function BoxLabelSVG({ d }: { d: LabelData }) {
  const { W, H } = LABEL_DIMS.BOX;
  const ctnNum   = d.cartonNumber ?? 1;
  const ctnTotal = d.totalCartons ?? 1;
  const to       = addrLines(d.toAddress).slice(0, 3);
  const barVal   = `BOX-${String(ctnNum).padStart(3, '0')}-${d.referenceNumber ?? 'REF'}`;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ fontFamily: 'monospace', display: 'block' }}>
      {/* bg */}
      <rect x={0} y={0} width={W} height={H} fill="#fff" stroke="#D1D5DB" strokeWidth={1} rx={4} />

      {/* header bar */}
      <rect x={0} y={0} width={W} height={28} fill="#1F2937" rx={4} />
      <rect x={0} y={18} width={W} height={10} fill="#1F2937" />
      <text x={12} y={19} fill="#fff" fontSize={10} fontWeight="bold" letterSpacing={2}>BOX / CARTON LABEL</text>

      {/* carton number – big */}
      <rect x={W - 78} y={4} width={66} height={44} fill="#F59E0B" rx={3} />
      <text x={W - 45} y={24} fill="#1F2937" fontSize={22} fontWeight="900" textAnchor="middle">{String(ctnNum).padStart(2, '0')}</text>
      <text x={W - 45} y={37} fill="#1F2937" fontSize={8} textAnchor="middle">of {ctnTotal}</text>

      {/* contents section */}
      <line x1={0} y1={50} x2={W} y2={50} stroke="#E5E7EB" strokeWidth={1} />
      <text x={12} y={63} fill="#6B7280" fontSize={7} fontWeight="bold" letterSpacing={1}>CONTENTS</text>
      <text x={12} y={75} fill="#111827" fontSize={10} fontWeight="bold">{d.contents ?? '—'}</text>
      <text x={12} y={88} fill="#6B7280" fontSize={8}>
        QTY: <tspan fill="#111827" fontWeight="600">{d.qtyPerCarton ?? '—'} {d.qtyUnit ?? 'PC'}</tspan>
        {'   '}BATCH: <tspan fill="#111827" fontWeight="600">{d.batchNumber ?? d.lotNumber ?? '—'}</tspan>
      </text>

      {/* to section */}
      <line x1={0} y1={98} x2={W} y2={98} stroke="#E5E7EB" strokeWidth={1} />
      <rect x={0} y={98} width={3} height={60} fill="#10B981" />
      <text x={12} y={111} fill="#10B981" fontSize={7} fontWeight="bold" letterSpacing={1}>SHIP TO</text>
      {to.map((l, i) => (
        <text key={i} x={12} y={122 + i * 12} fill="#111827" fontSize={i === 0 ? 10 : 8}
          fontWeight={i === 0 ? 'bold' : 'normal'}>{l}</text>
      ))}

      {/* PO + weight */}
      <line x1={0} y1={160} x2={W} y2={160} stroke="#E5E7EB" strokeWidth={1} />
      <text x={12} y={172} fill="#9CA3AF" fontSize={7} fontWeight="bold" letterSpacing={1}>PO REF.</text>
      <text x={12} y={182} fill="#111827" fontSize={9} fontWeight="600">{d.referenceNumber ?? '—'}</text>
      <line x1={W / 2} y1={160} x2={W / 2} y2={198} stroke="#E5E7EB" strokeWidth={0.8} />
      <text x={W / 2 + 10} y={172} fill="#9CA3AF" fontSize={7} fontWeight="bold" letterSpacing={1}>WEIGHT</text>
      <text x={W / 2 + 10} y={182} fill="#111827" fontSize={9} fontWeight="600">
        {d.weight != null ? `${d.weight} ${d.weightUnit ?? 'KG'}` : '—'}
      </text>

      {/* barcode */}
      <line x1={0} y1={198} x2={W} y2={198} stroke="#E5E7EB" strokeWidth={1} />
      <g transform={`translate(${(W - 248) / 2}, 202)`}>
        <Barcode value={barVal} width={248} height={40} />
      </g>
      <text x={W / 2} y={254} fill="#111827" fontSize={7} textAnchor="middle" letterSpacing={1.5} fontWeight="bold">
        {barVal}
      </text>
    </svg>
  );
}

// ── Main renderer ─────────────────────────────────────────────────────────────
export default function LabelPreview({ label }: { label: LabelData }) {
  switch (label.type) {
    case 'PALLET': return <PalletLabelSVG d={label} />;
    case 'HU':     return <HULabelSVG     d={label} />;
    case 'BOX':    return <BoxLabelSVG    d={label} />;
    default:       return <ShippingLabelSVG d={label} />;
  }
}
