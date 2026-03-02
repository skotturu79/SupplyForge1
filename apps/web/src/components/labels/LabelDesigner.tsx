'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type NodeType = 'text' | 'field' | 'barcode' | 'qr' | 'datamatrix' | 'rect' | 'divider' | 'image';

export interface DesignerNode {
  id: string;
  type: NodeType;
  x: number; y: number; w: number; h: number;
  text?: string;
  fieldKey?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  bgColor?: string;
  align?: 'left' | 'center' | 'right';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  imagePlaceholder?: string;
}

export interface LabelSize {
  label: string; W: number; H: number; printW: string; printH: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const SNAP_SIZE = 12;

export const SIZE_PRESETS: LabelSize[] = [
  { label: '6"×4"  Shipping', W: 432, H: 288, printW: '6in',   printH: '4in'   },
  { label: '4"×6"  Standard', W: 288, H: 432, printW: '4in',   printH: '6in'   },
  { label: '4"×4"  Square',   W: 288, H: 288, printW: '4in',   printH: '4in'   },
  { label: '5"×7"  Pallet',   W: 360, H: 504, printW: '5in',   printH: '7in'   },
  { label: 'A5  Portrait',    W: 420, H: 595, printW: '148mm', printH: '210mm' },
];

export const FIELD_OPTS: { key: string; label: string; sample: string }[] = [
  { key: 'trackingNumber',  label: 'Tracking Number',  sample: '7489234810294837'      },
  { key: 'carrier',         label: 'Carrier',           sample: 'FEDEX'                 },
  { key: 'service',         label: 'Service',           sample: 'INTL PRIORITY'         },
  { key: 'fromName',        label: 'From — Name',       sample: 'GlobalParts Ltd.'      },
  { key: 'fromStreet',      label: 'From — Street',     sample: 'Industriestr. 45'      },
  { key: 'fromCity',        label: 'From — City/Zip',   sample: 'Munich, DE  80331'     },
  { key: 'toName',          label: 'To — Name',         sample: 'Acme Manufacturing'    },
  { key: 'toStreet',        label: 'To — Street',       sample: '100 Industrial Blvd'   },
  { key: 'toCity',          label: 'To — City/State',   sample: 'Chicago, IL  60601'    },
  { key: 'referenceNumber', label: 'PO / Reference',    sample: 'PO-2026-0041'          },
  { key: 'weight',          label: 'Weight',             sample: '12.5 KG'              },
  { key: 'shipDate',        label: 'Ship Date',          sample: 'Feb 18, 2026'         },
  { key: 'sscc',            label: 'SSCC-18',            sample: '001234567890123456'   },
  { key: 'batchNumber',     label: 'Batch / Lot',        sample: 'LOT-2026-B47'         },
];

// Tenant name/address map for document binding
const TENANT_INFO: Record<string, { name: string; street: string; cityZip: string; country: string }> = {
  'tenant-biz-001': { name: 'Acme Manufacturing Co.', street: '100 Industrial Blvd', cityZip: 'Chicago, IL  60601', country: 'US' },
  'tenant-v-001':   { name: 'GlobalParts Ltd.',        street: 'Industriestr. 45',   cityZip: 'Munich  80331',       country: 'DE' },
  'tenant-v-002':   { name: 'FastShip Logistics',      street: '22 Commerce St',     cityZip: 'London  EC1A 1BB',    country: 'GB' },
  'tenant-v-003':   { name: 'PrecisionCast Inc.',      street: 'Av. Industria 78',   cityZip: 'Monterrey  64000',    country: 'MX' },
};

const PALETTE_ITEMS: { type: NodeType; label: string; icon: string; hint: string; defaults: Partial<DesignerNode> }[] = [
  { type: 'text',       label: 'Text Block',   icon: 'T',   hint: 'Static text label',         defaults: { w: 120, h: 18, text: 'Label text', fontSize: 12, color: '#111827', align: 'left' } },
  { type: 'field',      label: 'Data Field',   icon: '{}',  hint: 'Bound to label data',       defaults: { w: 160, h: 18, fieldKey: 'trackingNumber', fontSize: 10, fontWeight: 'bold', color: '#111827', align: 'left' } },
  { type: 'barcode',    label: 'Barcode 128',  icon: '|||', hint: 'Code-128 linear barcode',   defaults: { w: 200, h: 50, fieldKey: 'trackingNumber' } },
  { type: 'qr',         label: 'QR Code',      icon: '⊞',   hint: '2D QR matrix code',         defaults: { w: 80,  h: 80, fieldKey: 'trackingNumber' } },
  { type: 'datamatrix', label: 'Data Matrix',  icon: '⊟',   hint: 'GS1 2D Data Matrix',        defaults: { w: 72,  h: 72, fieldKey: 'sscc' } },
  { type: 'rect',       label: 'Rectangle',    icon: '▭',   hint: 'Box or section border',     defaults: { w: 140, h: 60, fill: 'transparent', stroke: '#9CA3AF', strokeWidth: 1, rx: 2 } },
  { type: 'divider',    label: 'Divider',      icon: '—',   hint: 'Horizontal separator',      defaults: { w: 220, h: 1,  fill: '#D1D5DB', stroke: '#D1D5DB', strokeWidth: 1 } },
  { type: 'image',      label: 'Logo / Image', icon: '🖼',  hint: 'Company logo placeholder',  defaults: { w: 80,  h: 40, fill: '#F3F4F6', stroke: '#D1D5DB', strokeWidth: 1, imagePlaceholder: 'LOGO' } },
];

export const STARTER_NODES: DesignerNode[] = [
  { id: 's1', type: 'rect',    x: 0,   y: 0,   w: 432, h: 36, fill: '#1F2937', stroke: 'none', strokeWidth: 0, rx: 4 },
  { id: 's2', type: 'text',    x: 12,  y: 6,   w: 200, h: 20, text: 'CUSTOM LABEL', fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', align: 'left' },
  { id: 's3', type: 'field',   x: 12,  y: 52,  w: 140, h: 16, fieldKey: 'fromName',   fontSize: 9,  fontWeight: 'bold', color: '#6B7280', align: 'left' },
  { id: 's4', type: 'field',   x: 12,  y: 70,  w: 200, h: 14, fieldKey: 'fromCity',   fontSize: 9,  color: '#111827', align: 'left' },
  { id: 's5', type: 'divider', x: 0,   y: 94,  w: 432, h: 1,  fill: '#E5E7EB' },
  { id: 's6', type: 'field',   x: 12,  y: 106, w: 200, h: 20, fieldKey: 'toName',    fontSize: 12, fontWeight: 'bold', color: '#111827', align: 'left' },
  { id: 's7', type: 'field',   x: 12,  y: 128, w: 200, h: 14, fieldKey: 'toStreet',  fontSize: 9,  color: '#374151', align: 'left' },
  { id: 's8', type: 'field',   x: 12,  y: 144, w: 200, h: 14, fieldKey: 'toCity',    fontSize: 9,  color: '#374151', align: 'left' },
  { id: 's9', type: 'field',   x: 300, y: 52,  w: 120, h: 14, fieldKey: 'referenceNumber', fontSize: 9, fontWeight: 'bold', color: '#111827', align: 'left' },
  { id: 'sA', type: 'divider', x: 0,   y: 198, w: 432, h: 1,  fill: '#E5E7EB' },
  { id: 'sB', type: 'barcode', x: 66,  y: 206, w: 300, h: 52, fieldKey: 'trackingNumber' },
  { id: 'sC', type: 'field',   x: 12,  y: 265, w: 408, h: 14, fieldKey: 'trackingNumber', fontSize: 10, fontWeight: 'bold', color: '#111827', align: 'center' },
];

// ── 2D Matrix helpers ──────────────────────────────────────────────────────────
function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h || 1;
}

// QR Code matrix — Version 1 (21×21) with finder patterns + timing + LFSR data
function generateQRMatrix(value: string): boolean[][] {
  const SIZE = 21;
  const m: boolean[][] = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false) as boolean[]);
  const fixed: boolean[][] = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false) as boolean[]);

  const setM = (r: number, c: number, dark: boolean) => {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    m[r][c] = dark; fixed[r][c] = true;
  };

  // Finder pattern: 7×7 with outer ring + inner 3×3 dark, separator around it
  const drawFinder = (br: number, bc: number) => {
    for (let dr = 0; dr <= 6; dr++)
      for (let dc = 0; dc <= 6; dc++) {
        const dark = dr === 0 || dr === 6 || dc === 0 || dc === 6
          || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
        setM(br + dr, bc + dc, dark);
      }
    for (let i = -1; i <= 7; i++) {
      setM(br - 1, bc + i, false); setM(br + 7, bc + i, false);
      setM(br + i, bc - 1, false); setM(br + i, bc + 7, false);
    }
  };
  drawFinder(0, 0); drawFinder(0, 14); drawFinder(14, 0);

  // Timing patterns (row 6 / col 6, alternating dark-light)
  for (let i = 8; i <= 12; i++) {
    setM(6, i, i % 2 === 0); setM(i, 6, i % 2 === 0);
  }

  // Dark module (version 1 fixed position)
  setM(13, 8, true);

  // Fill data area with deterministic LFSR seeded by value
  let s = hashStr(value || 'SAMPLE');
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!fixed[r][c]) {
        s ^= s << 13; s ^= s >> 17; s ^= s << 5; s = s >>> 0;
        m[r][c] = (s & 1) === 1;
      }
  return m;
}

// Data Matrix matrix — 16×16 with L-finder + clock borders + LFSR interior
function generateDataMatrix(value: string): boolean[][] {
  const SIZE = 16;
  const m: boolean[][] = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false) as boolean[]);

  // L-shaped quiet finder: solid left column + solid bottom row
  for (let i = 0; i < SIZE; i++) { m[i][0] = true; m[SIZE - 1][i] = true; }
  // Clock pattern: top row alternating (starts dark at 0) + right column alternating
  for (let i = 0; i < SIZE; i++) { m[0][i] = i % 2 === 0; m[i][SIZE - 1] = i % 2 === 0; }
  // Fix corners
  m[0][0] = true; m[SIZE - 1][0] = true; m[SIZE - 1][SIZE - 1] = true;

  // Fill interior modules with LFSR seeded by value
  let s = hashStr(value || 'SAMPLE');
  for (let r = 1; r < SIZE - 1; r++)
    for (let c = 1; c < SIZE - 1; c++) {
      s ^= s << 13; s ^= s >> 17; s ^= s << 5; s = s >>> 0;
      m[r][c] = (s & 1) === 1;
    }
  return m;
}

// ── Barcode SVG renderer (Code-128 style) ─────────────────────────────────────
function BarcodeGroup({ value, width, height }: { value: string; width: number; height: number }) {
  const bars: { x: number; w: number }[] = [];
  const chars = Array.from(value.slice(0, 26));
  const unitW = width / (chars.length * 7 + 12);
  let x = unitW * 0.5;
  [1.5, 1, 1.5].forEach((bw, i) => {
    if (i % 2 === 0) bars.push({ x, w: bw * unitW });
    x += bw * unitW + (i < 2 ? unitW : 0);
  });
  for (const ch of chars) {
    const c = ch.charCodeAt(0);
    const ps = [((c >> 5) % 3) + 1, ((c >> 3) % 2) + 1, ((c >> 1) % 3) + 1, (c % 2) + 1];
    ps.forEach((bw, i) => { if (i % 2 === 0) bars.push({ x, w: bw * unitW }); x += bw * unitW; });
  }
  bars.push({ x, w: 1.5 * unitW }); x += 2.5 * unitW; bars.push({ x, w: 2 * unitW });
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill="white" />
      {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={Math.max(0.5, b.w)} height={height} fill="#000" />)}
    </g>
  );
}

// ── QR Code SVG renderer ──────────────────────────────────────────────────────
function QRGroup({ value, width, height }: { value: string; width: number; height: number }) {
  const matrix = generateQRMatrix(value || 'SAMPLE');
  const SIZE = matrix.length;
  const mod = Math.min(width, height) / (SIZE + 2);
  const ox = (width - mod * SIZE) / 2;
  const oy = (height - mod * SIZE) / 2;
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill="white" />
      {matrix.flatMap((row, r) =>
        row.map((dark, c) =>
          dark ? <rect key={`${r}-${c}`} x={ox + c * mod} y={oy + r * mod} width={mod} height={mod} fill="#000" /> : null
        )
      )}
    </g>
  );
}

// ── Data Matrix SVG renderer ──────────────────────────────────────────────────
function DataMatrixGroup({ value, width, height }: { value: string; width: number; height: number }) {
  const matrix = generateDataMatrix(value || 'SAMPLE');
  const SIZE = matrix.length;
  const mod = Math.min(width, height) / (SIZE + 2);
  const ox = (width - mod * SIZE) / 2;
  const oy = (height - mod * SIZE) / 2;
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill="white" />
      {matrix.flatMap((row, r) =>
        row.map((dark, c) =>
          dark ? <rect key={`${r}-${c}`} x={ox + c * mod} y={oy + r * mod} width={mod + 0.3} height={mod + 0.3} fill="#000" /> : null
        )
      )}
    </g>
  );
}

// ── SVG node renderer ─────────────────────────────────────────────────────────
function NodeSVG({
  node, selected, inSelection, onMouseDown, dataContext,
}: {
  node: DesignerNode; selected: boolean; inSelection: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  dataContext: Record<string, string>;
}) {
  const fieldVal = dataContext[node.fieldKey ?? ''] ?? FIELD_OPTS.find(f => f.key === node.fieldKey)?.sample ?? node.fieldKey ?? '—';
  const displayText = node.type === 'field' ? fieldVal : (node.text ?? '');
  const anchorX = node.align === 'center' ? node.w / 2 : node.align === 'right' ? node.w - 2 : 2;
  const anchor = ({ left: 'start', center: 'middle', right: 'end' } as const)[node.align ?? 'left'];
  const barcodeVal = dataContext[node.fieldKey ?? ''] ?? FIELD_OPTS.find(f => f.key === node.fieldKey)?.sample ?? 'SAMPLE';
  const nodeH = Math.max(node.h, node.type === 'divider' ? 1 : 4);

  return (
    <g transform={`translate(${node.x},${node.y})`} onMouseDown={onMouseDown} style={{ cursor: 'move', userSelect: 'none' }}>
      <rect x={-2} y={-2} width={node.w + 4} height={nodeH + 4} fill="transparent" />

      {node.type === 'rect' && (
        <rect x={0} y={0} width={node.w} height={node.h}
          fill={node.fill ?? 'transparent'} stroke={node.stroke ?? '#9CA3AF'}
          strokeWidth={node.strokeWidth ?? 1} rx={node.rx ?? 0} />
      )}

      {node.type === 'divider' && (
        <line x1={0} y1={0} x2={node.w} y2={0}
          stroke={node.stroke ?? node.fill ?? '#D1D5DB'} strokeWidth={node.strokeWidth ?? 1} />
      )}

      {(node.type === 'text' || node.type === 'field') && (
        <>
          {node.bgColor && node.bgColor !== 'transparent' && (
            <rect x={0} y={0} width={node.w} height={node.h} fill={node.bgColor} />
          )}
          <text x={anchorX} y={node.h - 2} fill={node.color ?? '#111827'}
            fontSize={node.fontSize ?? 12} fontWeight={node.fontWeight ?? 'normal'}
            textAnchor={anchor} style={{ fontFamily: 'monospace' }}>
            {displayText}
          </text>
        </>
      )}

      {node.type === 'barcode'    && <BarcodeGroup    value={barcodeVal} width={node.w} height={node.h} />}
      {node.type === 'qr'         && <QRGroup         value={barcodeVal} width={node.w} height={node.h} />}
      {node.type === 'datamatrix' && <DataMatrixGroup  value={barcodeVal} width={node.w} height={node.h} />}

      {node.type === 'image' && (
        <g>
          <rect x={0} y={0} width={node.w} height={node.h}
            fill={node.fill ?? '#F3F4F6'} stroke={node.stroke ?? '#D1D5DB'}
            strokeWidth={node.strokeWidth ?? 1} strokeDasharray="4 2" rx={2} />
          <text x={node.w / 2} y={node.h / 2 + 4} fill="#9CA3AF"
            fontSize={Math.min(11, node.h / 2.5)} textAnchor="middle" style={{ fontFamily: 'sans-serif' }}>
            {node.imagePlaceholder ?? 'IMAGE'}
          </text>
        </g>
      )}

      {(selected || inSelection) && (
        <>
          <rect x={-2} y={-2} width={node.w + 4} height={nodeH + 4}
            fill="none" stroke={selected ? '#3B82F6' : '#93C5FD'}
            strokeWidth={selected ? 1.5 : 1} strokeDasharray="5 3" rx={2} />
          {selected && (
            <rect x={node.w - 4} y={nodeH - 4} width={8} height={8}
              fill="#3B82F6" rx={1} style={{ cursor: 'se-resize' }} />
          )}
        </>
      )}
    </g>
  );
}

// ── Number input helper ───────────────────────────────────────────────────────
function NumInput({ label, value, onChange, min = 0, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; step?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">{label}</label>
      <input type="number" min={min} step={step} className="input text-xs w-full py-1"
        value={Math.round(value * 10) / 10} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

// ── Alignment type ────────────────────────────────────────────────────────────
type AlignOp = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'dist-h' | 'dist-v';

// ── Main LabelDesigner component ──────────────────────────────────────────────
export default function LabelDesigner() {
  const [size,       setSize]       = useState<LabelSize>(SIZE_PRESETS[0]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showGrid,    setShowGrid]    = useState(true);

  // ── Node state + history ────────────────────────────────────────────────
  const [nodes, _setNodes]         = useState<DesignerNode[]>(STARTER_NODES);
  const [selectedIds, _setSelectedIds] = useState<string[]>([]);
  const [canUndo, setCanUndo]      = useState(false);
  const [canRedo, setCanRedo]      = useState(false);

  const nodesRef       = useRef<DesignerNode[]>(STARTER_NODES);
  const selectedIdsRef = useRef<string[]>([]);
  const historyRef     = useRef<{ stack: DesignerNode[][], idx: number }>({ stack: [[...STARTER_NODES]], idx: 0 });
  const clipboardRef   = useRef<DesignerNode[]>([]);
  const canvasRef      = useRef<HTMLDivElement>(null);
  const svgRef         = useRef<SVGSVGElement>(null);
  const resizing       = useRef<{ id: string; startW: number; startH: number; mx: number; my: number } | null>(null);

  // ── Document binding ────────────────────────────────────────────────────
  const [docs,           setDocs]          = useState<Record<string, unknown>[]>([]);
  const [selectedDocId,  setSelectedDocId] = useState('');
  const [dataContext,     setDataContext]   = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/v1/documents?limit=50')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.data) setDocs(d.data); })
      .catch(() => {});
  }, []);

  // ── Node/selection setters (keep refs in sync) ──────────────────────────
  const setNodes = useCallback((upd: DesignerNode[] | ((p: DesignerNode[]) => DesignerNode[])) => {
    const next = typeof upd === 'function' ? upd(nodesRef.current) : upd;
    nodesRef.current = next;
    _setNodes(next);
  }, []);

  const setSelectedIds = useCallback((upd: string[] | ((p: string[]) => string[])) => {
    const next = typeof upd === 'function' ? upd(selectedIdsRef.current) : upd;
    selectedIdsRef.current = next;
    _setSelectedIds(next);
  }, []);

  // ── History ops ─────────────────────────────────────────────────────────
  const pushHistory = useCallback((newNodes: DesignerNode[]) => {
    const h = historyRef.current;
    const stack = h.stack.slice(0, h.idx + 1);
    stack.push([...newNodes]);
    h.stack = stack; h.idx = stack.length - 1;
    setCanUndo(true); setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.idx <= 0) return;
    h.idx--;
    setNodes([...h.stack[h.idx]]);
    setCanUndo(h.idx > 0); setCanRedo(true);
    setSelectedIds([]);
  }, [setNodes, setSelectedIds]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.idx >= h.stack.length - 1) return;
    h.idx++;
    setNodes([...h.stack[h.idx]]);
    setCanUndo(true); setCanRedo(h.idx < h.stack.length - 1);
    setSelectedIds([]);
  }, [setNodes, setSelectedIds]);

  // Commit a change and push it to history
  const commit = useCallback((newNodes: DesignerNode[]) => {
    pushHistory(newNodes);
    setNodes(newNodes);
  }, [pushHistory, setNodes]);

  // ── Update a node's properties (live, no history per keystroke) ──────────
  const updateNode = useCallback((id: string, patch: Partial<DesignerNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));
  }, [setNodes]);

  // ── Snap ─────────────────────────────────────────────────────────────────
  const snap = useCallback((v: number) => snapEnabled ? Math.round(v / SNAP_SIZE) * SNAP_SIZE : v, [snapEnabled]);

  // ── Coordinate conversion ─────────────────────────────────────────────────
  const toSvg = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) * (size.W / rect.width), y: (clientY - rect.top) * (size.H / rect.height) };
  }, [size]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (!selectedIdsRef.current.length) return;
        const next = nodesRef.current.filter(n => !selectedIdsRef.current.includes(n.id));
        commit(next); setSelectedIds([]);
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
        if (e.key === 'a' && !isInput) { e.preventDefault(); setSelectedIds(nodesRef.current.map(n => n.id)); }
        if (e.key === 'c' && !isInput) {
          clipboardRef.current = nodesRef.current.filter(n => selectedIdsRef.current.includes(n.id)).map(n => ({ ...n }));
        }
        if (e.key === 'v' && !isInput && clipboardRef.current.length) {
          const now = Date.now();
          const pasted = clipboardRef.current.map((n, i) => ({ ...n, id: `n-${now}-${i}`, x: n.x + SNAP_SIZE, y: n.y + SNAP_SIZE }));
          const next = [...nodesRef.current, ...pasted];
          commit(next);
          setSelectedIds(pasted.map(n => n.id));
        }
        if (e.key === 'd' && !isInput) {
          e.preventDefault();
          if (!selectedIdsRef.current.length) return;
          const now = Date.now();
          const dup = nodesRef.current
            .filter(n => selectedIdsRef.current.includes(n.id))
            .map((n, i) => ({ ...n, id: `n-${now}-${i}`, x: n.x + SNAP_SIZE, y: n.y + SNAP_SIZE }));
          const next = [...nodesRef.current, ...dup];
          commit(next);
          setSelectedIds(dup.map(n => n.id));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commit, undo, redo, setSelectedIds]);

  // ── Drag from palette ─────────────────────────────────────────────────────
  const handlePaletteDragStart = (e: React.DragEvent, item: typeof PALETTE_ITEMS[0]) => {
    e.dataTransfer.setData('nodeType', item.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType') as NodeType;
    const item = PALETTE_ITEMS.find(p => p.type === nodeType);
    if (!item) return;
    const pos = toSvg(e.clientX, e.clientY);
    const def = item.defaults;
    const id = `n-${Date.now()}`;
    const newNode: DesignerNode = {
      id, type: nodeType,
      x: snap(Math.max(0, Math.min(size.W - (def.w ?? 100), pos.x - (def.w ?? 100) / 2))),
      y: snap(Math.max(0, Math.min(size.H - (def.h ?? 20),  pos.y - (def.h ?? 20) / 2))),
      w: def.w ?? 100, h: def.h ?? 20, ...def,
    };
    commit([...nodesRef.current, newNode]);
    setSelectedIds([id]);
  };

  // ── Drag node on canvas ────────────────────────────────────────────────────
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault(); e.stopPropagation();

    if (e.shiftKey) {
      setSelectedIds(prev => prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]);
      return;
    }

    if (!selectedIdsRef.current.includes(nodeId)) setSelectedIds([nodeId]);

    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sX = size.W / rect.width, sY = size.H / rect.height;

    // Resize handle check (bottom-right 8×8, only for single primary selection)
    if (selectedIdsRef.current.length <= 1 || !selectedIdsRef.current.includes(nodeId)) {
      const lx = (e.clientX - rect.left) * sX - node.x;
      const ly = (e.clientY - rect.top)  * sY - node.y;
      const nh = Math.max(node.h, 4);
      if (lx >= node.w - 4 && lx <= node.w + 4 && ly >= nh - 4 && ly <= nh + 4) {
        resizing.current = { id: nodeId, startW: node.w, startH: node.h, mx: e.clientX, my: e.clientY };
        const onMove = (ev: MouseEvent) => {
          if (!resizing.current) return;
          const r2 = canvasRef.current?.getBoundingClientRect();
          if (!r2) return;
          const dx = (ev.clientX - resizing.current.mx) * (size.W / r2.width);
          const dy = (ev.clientY - resizing.current.my) * (size.H / r2.height);
          setNodes(prev => prev.map(n => n.id === nodeId
            ? { ...n, w: Math.max(20, resizing.current!.startW + dx), h: Math.max(4, resizing.current!.startH + dy) } : n));
        };
        const onUp = () => {
          pushHistory([...nodesRef.current]);
          setCanUndo(true); setCanRedo(false);
          resizing.current = null;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return;
      }
    }

    // Move drag — drag all selected nodes if multi-selected
    const dragIds = (selectedIdsRef.current.includes(nodeId) && selectedIdsRef.current.length > 1)
      ? selectedIdsRef.current : [nodeId];
    const startPos: Record<string, { x: number; y: number }> = {};
    for (const id of dragIds) {
      const n = nodesRef.current.find(nn => nn.id === id);
      if (n) startPos[id] = { x: n.x, y: n.y };
    }
    const startMx = e.clientX, startMy = e.clientY;

    const onMove = (ev: MouseEvent) => {
      const r2 = canvasRef.current?.getBoundingClientRect();
      if (!r2) return;
      const dx = (ev.clientX - startMx) * (size.W / r2.width);
      const dy = (ev.clientY - startMy) * (size.H / r2.height);
      setNodes(prev => prev.map(n => {
        if (!startPos[n.id]) return n;
        const sp = startPos[n.id];
        return { ...n, x: Math.max(0, snap(sp.x + dx)), y: Math.max(0, snap(sp.y + dy)) };
      }));
    };
    const onUp = () => {
      pushHistory([...nodesRef.current]);
      setCanUndo(true); setCanRedo(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [size, snap, setNodes, setSelectedIds, pushHistory]);

  // ── Layer ops ─────────────────────────────────────────────────────────────
  const moveLayer = useCallback((dir: 1 | -1) => {
    const id = selectedIdsRef.current[selectedIdsRef.current.length - 1];
    if (!id) return;
    const next = [...nodesRef.current];
    const i = next.findIndex(n => n.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  }, [commit]);

  // ── Alignment ─────────────────────────────────────────────────────────────
  const alignNodes = useCallback((op: AlignOp) => {
    const ids = selectedIdsRef.current;
    if (ids.length < 2) return;
    const sel = nodesRef.current.filter(n => ids.includes(n.id));
    const minX = Math.min(...sel.map(n => n.x));
    const maxX = Math.max(...sel.map(n => n.x + n.w));
    const minY = Math.min(...sel.map(n => n.y));
    const maxY = Math.max(...sel.map(n => n.y + n.h));
    let next = nodesRef.current;
    switch (op) {
      case 'left':     next = next.map(n => ids.includes(n.id) ? { ...n, x: minX } : n); break;
      case 'center-h': next = next.map(n => ids.includes(n.id) ? { ...n, x: (minX + maxX) / 2 - n.w / 2 } : n); break;
      case 'right':    next = next.map(n => ids.includes(n.id) ? { ...n, x: maxX - n.w } : n); break;
      case 'top':      next = next.map(n => ids.includes(n.id) ? { ...n, y: minY } : n); break;
      case 'center-v': next = next.map(n => ids.includes(n.id) ? { ...n, y: (minY + maxY) / 2 - n.h / 2 } : n); break;
      case 'bottom':   next = next.map(n => ids.includes(n.id) ? { ...n, y: maxY - n.h } : n); break;
      case 'dist-h': {
        const sorted = [...sel].sort((a, b) => a.x - b.x);
        const totalW = sel.reduce((s, n) => s + n.w, 0);
        const gap = (maxX - minX - totalW) / (sel.length - 1);
        let px = minX;
        const pm: Record<string, number> = {};
        sorted.forEach(n => { pm[n.id] = px; px += n.w + gap; });
        next = next.map(n => ids.includes(n.id) ? { ...n, x: pm[n.id] } : n);
        break;
      }
      case 'dist-v': {
        const sorted = [...sel].sort((a, b) => a.y - b.y);
        const totalH = sel.reduce((s, n) => s + n.h, 0);
        const gap = (maxY - minY - totalH) / (sel.length - 1);
        let py = minY;
        const pm: Record<string, number> = {};
        sorted.forEach(n => { pm[n.id] = py; py += n.h + gap; });
        next = next.map(n => ids.includes(n.id) ? { ...n, y: pm[n.id] } : n);
        break;
      }
    }
    commit(next);
  }, [commit]);

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll('[stroke="#3B82F6"],[stroke="#93C5FD"]').forEach(el => el.remove());
    clone.querySelectorAll('[fill="#3B82F6"]').forEach(el => el.remove());
    const str = new XMLSerializer().serializeToString(clone);
    const win = window.open('', '_blank', 'width=700,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Custom Label</title>
      <style>@page{margin:5mm;size:${size.printW} ${size.printH};}
        body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;}
        svg{width:${size.printW};height:${size.printH};}</style></head>
      <body>${str}
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),600);}<\/script>
      </body></html>`);
    win.document.close();
  };

  // ── Document binding ───────────────────────────────────────────────────────
  const handleDocSelect = (docId: string) => {
    setSelectedDocId(docId);
    if (!docId) { setDataContext({}); return; }
    const doc = docs.find((d) => (d as Record<string, unknown>).id === docId) as Record<string, unknown> | undefined;
    if (!doc) return;
    const senderTenantId   = doc.senderTenantId   as string ?? '';
    const receiverTenantId = doc.receiverTenantId  as string ?? '';
    const sender   = TENANT_INFO[senderTenantId]   ?? {};
    const receiver = TENANT_INFO[receiverTenantId] ?? {};
    const dateStr  = (doc.sentAt ?? doc.createdAt) as string | undefined;
    setDataContext({
      referenceNumber: (doc.referenceNumber as string) ?? '',
      fromName:    sender.name    ?? '',
      fromStreet:  sender.street  ?? '',
      fromCity:    `${sender.cityZip ?? ''} ${sender.country ?? ''}`.trim(),
      toName:      receiver.name    ?? '',
      toStreet:    receiver.street  ?? '',
      toCity:      `${receiver.cityZip ?? ''} ${receiver.country ?? ''}`.trim(),
      shipDate:    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      carrier: 'FEDEX', service: 'INTL PRIORITY',
      trackingNumber: '', sscc: '', batchNumber: '', weight: '',
    });
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const primaryId    = selectedIds[selectedIds.length - 1] ?? null;
  const selectedNode = nodes.find(n => n.id === primaryId) ?? null;
  const multiSelect  = selectedIds.length > 1;
  const aspect       = `${size.W}/${size.H}`;

  return (
    <div className="flex gap-0 h-full min-h-[560px]" style={{ fontFamily: 'system-ui,sans-serif' }}>

      {/* ── PALETTE ─────────────────────────────────────────────────── */}
      <div className="w-44 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="px-3 py-2.5 border-b border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Elements</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Drag onto canvas</p>
        </div>

        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {PALETTE_ITEMS.map(item => (
            <div key={item.type} draggable
              onDragStart={e => handlePaletteDragStart(e, item)}
              className="flex items-center gap-2 px-2.5 py-2 bg-white rounded-lg border border-gray-200 cursor-grab hover:border-emerald-400 hover:bg-emerald-50 active:cursor-grabbing transition-colors select-none"
              title={item.hint}>
              <span className="w-5 text-center text-xs font-bold text-gray-500 shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{item.label}</p>
                <p className="text-[10px] text-gray-400 truncate">{item.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Size selector */}
        <div className="px-3 py-3 border-t border-gray-200 space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Label Size</p>
          <select className="input text-xs w-full py-1"
            value={SIZE_PRESETS.indexOf(size)} onChange={e => setSize(SIZE_PRESETS[+e.target.value])}>
            {SIZE_PRESETS.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
          </select>
          <p className="text-[10px] text-gray-400">{size.printW} × {size.printH}</p>
        </div>

        {/* Actions */}
        <div className="px-3 pb-3 space-y-1.5">
          <button onClick={handlePrint}
            className="w-full text-xs bg-emerald-600 text-white rounded-lg py-2 font-medium hover:bg-emerald-700 transition-colors">
            🖨 Print Label
          </button>
          <button onClick={() => { commit(STARTER_NODES); setSelectedIds([]); }}
            className="w-full text-xs bg-white border border-gray-200 text-gray-600 rounded-lg py-1.5 hover:border-gray-300 transition-colors">
            Reset to starter
          </button>
          <button onClick={() => { commit([]); setSelectedIds([]); }}
            className="w-full text-xs text-red-500 hover:text-red-700 transition-colors py-1">
            Clear all
          </button>
        </div>
      </div>

      {/* ── CANVAS ──────────────────────────────────────────────────── */}
      <div className="flex-1 bg-[#E8EAED] flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 flex items-center gap-1 px-3 flex-wrap min-h-[36px] py-1">

          {/* Document binding */}
          <select
            className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 bg-white hover:border-gray-300"
            value={selectedDocId} onChange={e => handleDocSelect(e.target.value)}>
            <option value="">Link Doc…</option>
            {docs.map(d => {
              const doc = d as Record<string, unknown>;
              return <option key={doc.id as string} value={doc.id as string}>{doc.type as string} {doc.referenceNumber as string}</option>;
            })}
          </select>

          <span className="text-gray-200 mx-0.5">|</span>

          {/* Undo / Redo */}
          <button onClick={undo} disabled={!canUndo}
            className="text-xs px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)">↩ Undo</button>
          <button onClick={redo} disabled={!canRedo}
            className="text-xs px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)">↪ Redo</button>

          <span className="text-gray-200 mx-0.5">|</span>

          {/* Snap / Grid toggles */}
          <button onClick={() => setSnapEnabled(v => !v)}
            className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${snapEnabled ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
            title="Snap to grid">⊞ Snap</button>
          <button onClick={() => setShowGrid(v => !v)}
            className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${showGrid ? 'bg-gray-100 border-gray-300 text-gray-600' : 'border-gray-200 text-gray-400'}`}
            title="Show/hide grid">⋯ Grid</button>

          {/* Layer / node actions (single select) */}
          {primaryId && !multiSelect && (
            <>
              <span className="text-gray-200 mx-0.5">|</span>
              <button onClick={() => moveLayer(-1)} className="text-xs text-gray-500 hover:text-gray-800 px-1" title="Bring forward">↑ Fwd</button>
              <button onClick={() => moveLayer(1)}  className="text-xs text-gray-500 hover:text-gray-800 px-1" title="Send backward">↓ Back</button>
              <button onClick={() => {
                const n = nodesRef.current.find(x => x.id === primaryId);
                if (!n) return;
                const cl: DesignerNode = { ...n, id: `n-${Date.now()}`, x: n.x + SNAP_SIZE, y: n.y + SNAP_SIZE };
                commit([...nodesRef.current, cl]); setSelectedIds([cl.id]);
              }} className="text-xs text-gray-500 hover:text-gray-800 px-1">⊕ Dup</button>
              <button onClick={() => { commit(nodesRef.current.filter(n => n.id !== primaryId)); setSelectedIds([]); }}
                className="text-xs text-red-500 hover:text-red-700 px-1">✕ Del</button>
            </>
          )}

          {/* Alignment tools (multi-select) */}
          {multiSelect && (
            <>
              <span className="text-gray-200 mx-0.5">|</span>
              <span className="text-[10px] text-gray-400 mr-0.5">{selectedIds.length} sel</span>
              {([
                ['left',     '⬤⬜⬜', 'Align left'],
                ['center-h', '⬜⬤⬜', 'Center horizontally'],
                ['right',    '⬜⬜⬤', 'Align right'],
                ['top',      '⬆', 'Align top'],
                ['center-v', '↕', 'Center vertically'],
                ['bottom',   '⬇', 'Align bottom'],
                ['dist-h',   '↔', 'Distribute horizontally'],
                ['dist-v',   '↕↕', 'Distribute vertically'],
              ] as [AlignOp, string, string][]).map(([op, icon, title]) => (
                <button key={op} onClick={() => alignNodes(op)}
                  className="text-xs px-1.5 py-0.5 rounded border border-gray-200 text-gray-600 hover:border-emerald-400 hover:bg-emerald-50"
                  title={title}>{icon}</button>
              ))}
              <button onClick={() => { commit(nodesRef.current.filter(n => !selectedIds.includes(n.id))); setSelectedIds([]); }}
                className="text-xs text-red-500 hover:text-red-700 px-1">✕ Del all</button>
            </>
          )}

          {/* Coords */}
          <span className="ml-auto text-[10px] text-gray-400 shrink-0">
            {selectedNode
              ? `x:${Math.round(selectedNode.x)} y:${Math.round(selectedNode.y)} w:${Math.round(selectedNode.w)} h:${Math.round(selectedNode.h)}`
              : `${nodes.length} node${nodes.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Canvas drop area */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div ref={canvasRef} className="shadow-2xl"
            style={{ aspectRatio: aspect, maxWidth: '100%', maxHeight: '100%',
              width: size.W > size.H ? '100%' : 'auto', height: size.W > size.H ? 'auto' : '100%' }}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={handleCanvasDrop}
            onClick={e => { if ((e.target as Element).tagName === 'svg' || e.target === e.currentTarget) setSelectedIds([]); }}>
            <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg"
              viewBox={`0 0 ${size.W} ${size.H}`}
              style={{ width: '100%', height: '100%', display: 'block', fontFamily: 'monospace' }}>
              <rect x={0} y={0} width={size.W} height={size.H} fill="#ffffff" />

              {showGrid && (
                <>
                  <defs>
                    <pattern id="lbl-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="12" cy="12" r="0.6" fill="#D1D5DB" />
                    </pattern>
                  </defs>
                  <rect x={0} y={0} width={size.W} height={size.H} fill="url(#lbl-grid)" />
                </>
              )}

              {nodes.map(node => (
                <NodeSVG key={node.id} node={node}
                  selected={node.id === primaryId}
                  inSelection={selectedIds.includes(node.id) && node.id !== primaryId}
                  onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  dataContext={dataContext}
                />
              ))}

              <rect x={0.5} y={0.5} width={size.W - 1} height={size.H - 1}
                fill="none" stroke="#D1D5DB" strokeWidth={1} />
            </svg>
          </div>
        </div>
      </div>

      {/* ── PROPERTIES ──────────────────────────────────────────────── */}
      <div className="w-52 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
        {!selectedNode ? (
          <div className="flex-1 flex flex-col">
            {multiSelect ? (
              <div className="p-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{selectedIds.length} nodes selected</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">Use alignment tools in the toolbar to reposition. Shift+click to add/remove nodes.</p>
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {(['left','center-h','right','top','center-v','bottom'] as AlignOp[]).map(op => (
                    <button key={op} onClick={() => alignNodes(op)}
                      className="text-xs border border-gray-200 rounded py-1 text-gray-600 hover:border-emerald-400 hover:bg-emerald-50 capitalize">
                      {op.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-xs text-gray-400 leading-snug">Click a node to edit properties</p>
                  <p className="text-[10px] text-gray-300 mt-2">Shift+click multi-select</p>
                  <p className="text-[10px] text-gray-300">Ctrl+A select all</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {/* Type badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{selectedNode.type}</span>
              <button onClick={() => { commit(nodesRef.current.filter(n => n.id !== primaryId)); setSelectedIds([]); }}
                className="text-xs text-red-500 hover:text-red-700">Delete</button>
            </div>

            {/* Position & size */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Position & Size</p>
              <div className="grid grid-cols-2 gap-1.5">
                <NumInput label="X" value={selectedNode.x} onChange={v => updateNode(selectedNode.id, { x: snap(v) })} />
                <NumInput label="Y" value={selectedNode.y} onChange={v => updateNode(selectedNode.id, { y: snap(v) })} />
                <NumInput label="W" value={selectedNode.w} onChange={v => updateNode(selectedNode.id, { w: Math.max(1, v) })} min={1} />
                <NumInput label="H" value={selectedNode.h} onChange={v => updateNode(selectedNode.id, { h: Math.max(1, v) })} min={1} />
              </div>
            </div>

            {/* Text / Field content */}
            {(selectedNode.type === 'text' || selectedNode.type === 'field') && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Content</p>

                {selectedNode.type === 'text' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Text</label>
                    <input className="input text-xs w-full" value={selectedNode.text ?? ''}
                      onChange={e => updateNode(selectedNode.id, { text: e.target.value })} />
                  </div>
                )}

                {selectedNode.type === 'field' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Bind to field</label>
                    <select className="input text-xs w-full py-1" value={selectedNode.fieldKey ?? ''}
                      onChange={e => updateNode(selectedNode.id, { fieldKey: e.target.value })}>
                      {FIELD_OPTS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                    <p className="text-[10px] text-emerald-600 mt-0.5 truncate">
                      {dataContext[selectedNode.fieldKey ?? '']
                        ? `Doc: ${dataContext[selectedNode.fieldKey ?? '']}`
                        : `Sample: ${FIELD_OPTS.find(f => f.key === selectedNode.fieldKey)?.sample ?? '—'}`}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5">
                  <NumInput label="Font size" value={selectedNode.fontSize ?? 12} min={6}
                    onChange={v => updateNode(selectedNode.id, { fontSize: v })} />
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Weight</label>
                    <select className="input text-xs w-full py-1" value={selectedNode.fontWeight ?? 'normal'}
                      onChange={e => updateNode(selectedNode.id, { fontWeight: e.target.value as 'normal' | 'bold' })}>
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Color</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="color" className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                      value={selectedNode.color ?? '#111827'} onChange={e => updateNode(selectedNode.id, { color: e.target.value })} />
                    <input className="input text-xs flex-1 py-1" value={selectedNode.color ?? '#111827'}
                      onChange={e => updateNode(selectedNode.id, { color: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Align</label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map(a => (
                      <button key={a} onClick={() => updateNode(selectedNode.id, { align: a })}
                        className={`flex-1 text-xs py-1 rounded border transition-colors ${selectedNode.align === a ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {a[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Background</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="color" className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                      value={selectedNode.bgColor && selectedNode.bgColor !== 'transparent' ? selectedNode.bgColor : '#ffffff'}
                      onChange={e => updateNode(selectedNode.id, { bgColor: e.target.value })} />
                    <input className="input text-xs flex-1 py-1" value={selectedNode.bgColor ?? 'transparent'}
                      onChange={e => updateNode(selectedNode.id, { bgColor: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Barcode / QR / Data Matrix */}
            {(selectedNode.type === 'barcode' || selectedNode.type === 'qr' || selectedNode.type === 'datamatrix') && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  {selectedNode.type === 'barcode' ? 'Code-128' : selectedNode.type === 'qr' ? 'QR Code' : 'Data Matrix'}
                </p>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Bind to field</label>
                  <select className="input text-xs w-full py-1" value={selectedNode.fieldKey ?? 'trackingNumber'}
                    onChange={e => updateNode(selectedNode.id, { fieldKey: e.target.value })}>
                    {FIELD_OPTS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
                <p className="text-[10px] text-gray-400 leading-snug">
                  {selectedNode.type === 'barcode' ? 'Linear barcode encodes the field value.' :
                   selectedNode.type === 'qr' ? 'QR encodes up to ~2KB. Great for URLs or tracking numbers.' :
                   'GS1 Data Matrix — used for SSCC-18 and supply chain labels.'}
                </p>
              </div>
            )}

            {/* Image placeholder */}
            {selectedNode.type === 'image' && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Image / Logo</p>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Placeholder label</label>
                  <input className="input text-xs w-full" value={selectedNode.imagePlaceholder ?? 'LOGO'}
                    onChange={e => updateNode(selectedNode.id, { imagePlaceholder: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Background</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="color" className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                      value={selectedNode.fill ?? '#F3F4F6'} onChange={e => updateNode(selectedNode.id, { fill: e.target.value })} />
                    <input className="input text-xs flex-1 py-1" value={selectedNode.fill ?? '#F3F4F6'}
                      onChange={e => updateNode(selectedNode.id, { fill: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Rectangle */}
            {selectedNode.type === 'rect' && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Rectangle</p>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Fill color</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="color" className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                      value={selectedNode.fill === 'transparent' ? '#ffffff' : (selectedNode.fill ?? '#F9FAFB')}
                      onChange={e => updateNode(selectedNode.id, { fill: e.target.value })} />
                    <input className="input text-xs flex-1 py-1" value={selectedNode.fill ?? 'transparent'}
                      onChange={e => updateNode(selectedNode.id, { fill: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Border color</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="color" className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                      value={selectedNode.stroke ?? '#9CA3AF'} onChange={e => updateNode(selectedNode.id, { stroke: e.target.value })} />
                    <input className="input text-xs flex-1 py-1" value={selectedNode.stroke ?? '#9CA3AF'}
                      onChange={e => updateNode(selectedNode.id, { stroke: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <NumInput label="Border W" value={selectedNode.strokeWidth ?? 1} min={0} step={0.5}
                    onChange={v => updateNode(selectedNode.id, { strokeWidth: v })} />
                  <NumInput label="Radius" value={selectedNode.rx ?? 0}
                    onChange={v => updateNode(selectedNode.id, { rx: v })} />
                </div>
              </div>
            )}

            {/* Divider */}
            {selectedNode.type === 'divider' && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Divider</p>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Color</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="color" className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                      value={selectedNode.stroke ?? '#D1D5DB'}
                      onChange={e => updateNode(selectedNode.id, { stroke: e.target.value, fill: e.target.value })} />
                    <input className="input text-xs flex-1 py-1" value={selectedNode.stroke ?? '#D1D5DB'}
                      onChange={e => updateNode(selectedNode.id, { stroke: e.target.value })} />
                  </div>
                </div>
                <NumInput label="Thickness" value={selectedNode.strokeWidth ?? 1} min={0.5} step={0.5}
                  onChange={v => updateNode(selectedNode.id, { strokeWidth: v, h: v })} />
              </div>
            )}

            {/* Layer / duplicate footer */}
            <div className="pt-1 border-t border-gray-100 flex gap-2">
              <button onClick={() => {
                const n = selectedNode;
                const cl: DesignerNode = { ...n, id: `n-${Date.now()}`, x: n.x + SNAP_SIZE, y: n.y + SNAP_SIZE };
                commit([...nodesRef.current, cl]); setSelectedIds([cl.id]);
              }} className="flex-1 text-xs border border-gray-200 rounded py-1.5 text-gray-600 hover:border-gray-300">⊕ Duplicate</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => moveLayer(-1)} className="flex-1 text-xs border border-gray-200 rounded py-1.5 text-gray-600 hover:border-gray-300" title="Bring forward">↑ Forward</button>
              <button onClick={() => moveLayer(1)}  className="flex-1 text-xs border border-gray-200 rounded py-1.5 text-gray-600 hover:border-gray-300" title="Send backward">↓ Backward</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
