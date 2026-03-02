'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getStoredUser } from '@/lib/mock-auth';
import LabelPreview, { type LabelData, type LabelType, LABEL_DIMS } from '@/components/labels/LabelPreview';
import LabelDesigner from '@/components/labels/LabelDesigner';

// ── Label type metadata ────────────────────────────────────────────
type PageLabelType = LabelType | 'CUSTOM';

const LABEL_TYPES: Record<PageLabelType, { label: string; desc: string; icon: string }> = {
  SHIPPING: { label: 'Shipping',        icon: '🚚', desc: 'Carrier-branded label with tracking number' },
  PALLET:   { label: 'Pallet',          icon: '🏗️',  desc: 'GS1 pallet label with SSCC-18 barcode' },
  HU:       { label: 'Handling Unit',   icon: '📦', desc: 'SAP-style handling unit label' },
  BOX:      { label: 'Box / Carton',    icon: '🗳️',  desc: 'Sequential carton label (X of Y)' },
  CUSTOM:   { label: 'Custom',          icon: '✏️',  desc: 'Drag & drop canvas label designer' },
};

const CARRIERS   = ['FEDEX', 'UPS', 'DHL', 'USPS'] as const;
type Carrier     = typeof CARRIERS[number];
const CARRIER_SERVICES: Record<Carrier, string[]> = {
  FEDEX: ['FEDEX_INTERNATIONAL_PRIORITY', 'FEDEX_INTERNATIONAL_ECONOMY', 'FEDEX_GROUND'],
  UPS:   ['UPS_WORLDWIDE_EXPRESS', 'UPS_WORLDWIDE_EXPEDITED', 'UPS_STANDARD'],
  DHL:   ['DHL_EXPRESS_WORLDWIDE', 'DHL_EXPRESS_12', 'DHL_ECONOMY_SELECT'],
  USPS:  ['PRIORITY_MAIL_INTERNATIONAL', 'FIRST_CLASS_PACKAGE_INTERNATIONAL', 'PRIORITY_MAIL'],
};
const LABEL_FORMATS = ['PDF', 'ZPL', 'PNG'] as const;
const UNITS_TYPES   = ['CTN', 'PLT', 'PC', 'KG', 'PAL'];
const QTY_UNITS     = ['PC', 'KG', 'L', 'M', 'CTN', 'SET'];

const CARRIER_BADGE: Record<string, string> = {
  FEDEX: 'bg-purple-100 text-purple-800',
  UPS:   'bg-amber-100  text-amber-800',
  DHL:   'bg-yellow-100 text-yellow-800',
  USPS:  'bg-blue-100   text-blue-800',
};
const TYPE_BADGE: Record<LabelType, string> = {
  SHIPPING: 'bg-indigo-100 text-indigo-800',
  PALLET:   'bg-orange-100 text-orange-800',
  HU:       'bg-cyan-100   text-cyan-800',
  BOX:      'bg-gray-100   text-gray-700',
};

// ── Address block component ────────────────────────────────────────
interface Address { name: string; street: string; city: string; state: string; zip: string; country: string; phone: string }
const EMPTY_ADDR: Address = { name: '', street: '', city: '', state: '', zip: '', country: '', phone: '' };

function AddressBlock({ label, value, onChange }: { label: string; value: Address; onChange: (a: Address) => void }) {
  const field = (key: keyof Address, ph: string, half = false) => (
    <input key={key} className={`input text-sm ${half ? 'w-[calc(50%-4px)]' : 'w-full'}`}
      placeholder={ph} value={value[key]}
      onChange={(e) => onChange({ ...value, [key]: e.target.value })} />
  );
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      {field('name', 'Company / Full name')}
      {field('street', 'Street address')}
      <div className="flex gap-2 flex-wrap">{field('city', 'City', true)}{field('state', 'State', true)}</div>
      <div className="flex gap-2 flex-wrap">{field('zip', 'ZIP / Postal', true)}{field('country', 'Country (e.g. DE)', true)}</div>
      {field('phone', 'Phone')}
    </div>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(!value)}>
      <div className={`w-9 h-5 rounded-full flex items-center transition-colors ${value ? 'bg-emerald-500' : 'bg-gray-200'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${value ? 'translate-x-4' : ''}`} />
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </label>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function VendorLabelsPage() {
  const qc   = useQueryClient();
  const user = getStoredUser();
  const printRef = useRef<HTMLDivElement>(null);

  // ── Label type ───────────────────────────────────────────────────
  const [labelType, setLabelType] = useState<PageLabelType>('SHIPPING');

  // ── Shared state ─────────────────────────────────────────────────
  const [fromAddr, setFromAddr] = useState<Address>({
    name: user?.tenantName ?? 'My Company', street: 'Industriestr. 45', city: 'Munich',
    state: '', zip: '80331', country: 'DE', phone: '+49-89-000000',
  });
  const [toAddr,   setToAddr]   = useState<Address>({ ...EMPTY_ADDR });
  const [refNum,   setRefNum]   = useState('');
  const [batch,    setBatch]    = useState('');
  const [lot,      setLot]      = useState('');

  // ── Shipping ─────────────────────────────────────────────────────
  const [carrier,     setCarrier]     = useState<Carrier>('FEDEX');
  const [service,     setService]     = useState(CARRIER_SERVICES.FEDEX[0]);
  const [labelFormat, setLabelFormat] = useState<string>('PDF');
  const [weight,      setWeight]      = useState('');
  const [weightUnit,  setWeightUnit]  = useState<'LB' | 'KG'>('KG');
  const [dimL, setDimL] = useState(''); const [dimW, setDimW] = useState(''); const [dimH, setDimH] = useState('');
  const [dimUnit, setDimUnit]   = useState<'CM' | 'IN'>('CM');
  const [orderId, setOrderId]   = useState('');
  const [isReturn, setIsReturn] = useState(false);
  const [sigReq,   setSigReq]   = useState(false);

  // ── Pallet ───────────────────────────────────────────────────────
  const [content,      setContent]      = useState('');
  const [grossWeight,  setGrossWeight]  = useState('');
  const [grossUnit,    setGrossUnit]    = useState<'KG' | 'LB'>('KG');
  const [units,        setUnits]        = useState('');
  const [unitsType,    setUnitsType]    = useState('CTN');
  const [prodDate,     setProdDate]     = useState('');
  const [expiryDate,   setExpiryDate]   = useState('');

  // ── HU ───────────────────────────────────────────────────────────
  const [huNumber,    setHuNumber]    = useState('');
  const [matNumber,   setMatNumber]   = useState('');
  const [matDesc,     setMatDesc]     = useState('');
  const [quantity,    setQuantity]    = useState('');
  const [qtyUnit,     setQtyUnit]     = useState('PC');
  const [delivery,    setDelivery]    = useState('');
  const [plant,       setPlant]       = useState('');
  const [storageLoc,  setStorageLoc]  = useState('');

  // ── Box ──────────────────────────────────────────────────────────
  const [contents,     setContents]     = useState('');
  const [cartonNum,    setCartonNum]    = useState('1');
  const [totalCartons, setTotalCartons] = useState('');
  const [qtyPerCarton, setQtyPerCarton] = useState('');
  const [boxQtyUnit,   setBoxQtyUnit]   = useState('PC');
  const [boxWeight,    setBoxWeight]    = useState('');

  // ── Preview & history ────────────────────────────────────────────
  const [preview,       setPreview]       = useState<(LabelData & { id?: string; rateCharged?: number; createdAt?: string }) | null>(null);
  const [historyFilter, setHistoryFilter] = useState('');

  // ── Build live preview from form state ───────────────────────────
  const livePreview: LabelData = (() => {
    const base = { type: labelType as LabelType, fromAddress: fromAddr, toAddress: toAddr, referenceNumber: refNum || null, batchNumber: batch || undefined, lotNumber: lot || undefined };
    if (labelType === 'SHIPPING') return { ...base, carrier, service, labelFormat, trackingNumber: 'PREVIEW-ONLY', isReturn, signatureRequired: sigReq, weight: parseFloat(weight) || undefined, weightUnit, dimensions: dimL && dimW && dimH ? { l: +dimL, w: +dimW, h: +dimH, unit: dimUnit } : null, orderId: orderId || null };
    if (labelType === 'PALLET')  return { ...base, sscc: '000000000000000000', content: content || undefined, grossWeight: parseFloat(grossWeight) || undefined, grossWeightUnit: grossUnit, units: parseInt(units) || undefined, unitsType, productionDate: prodDate || undefined, expiryDate: expiryDate || undefined };
    if (labelType === 'HU')     return { ...base, huNumber: huNumber || 'HU-PREVIEW', materialNumber: matNumber || undefined, materialDescription: matDesc || undefined, quantity: parseFloat(quantity) || undefined, quantityUnit: qtyUnit, deliveryNumber: delivery || undefined, plant: plant || undefined, storageLocation: storageLoc || undefined };
    // BOX
    return { ...base, contents: contents || undefined, cartonNumber: parseInt(cartonNum) || 1, totalCartons: parseInt(totalCartons) || 1, qtyPerCarton: parseFloat(qtyPerCarton) || undefined, qtyUnit: boxQtyUnit, weight: parseFloat(boxWeight) || undefined, weightUnit: 'KG' };
  })();

  // ── Carrier change ───────────────────────────────────────────────
  const handleCarrierChange = (c: Carrier) => { setCarrier(c); setService(CARRIER_SERVICES[c][0]); };

  // ── Label type change (reset preview) ────────────────────────────
  const handleTypeChange = (t: PageLabelType) => { setLabelType(t); setPreview(null); };

  // ── History ──────────────────────────────────────────────────────
  const { data: historyData, isLoading: historyLoading } = useQuery<{ data: (LabelData & { id: string; rateCharged?: number; createdAt: string })[]; meta: { total: number } }>({
    queryKey: ['vendor-labels', user?.tenantId, historyFilter],
    queryFn: () => apiClient.get('/carriers/labels', { params: { tenantId: user?.tenantId, carrier: historyFilter || undefined, limit: 40 } }).then(r => r.data),
    enabled: !!user?.tenantId,
  });

  // ── Generate ─────────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: (payload: object) =>
      apiClient.post(`/carriers/${labelType === 'SHIPPING' ? carrier : 'NONE'}/labels`, payload).then((r: { data: unknown }) => r.data),
    onSuccess: (label) => { setPreview(label as LabelData); qc.invalidateQueries({ queryKey: ['vendor-labels'] }); },
  });

  const handleGenerate = () => {
    if (labelType === 'CUSTOM') return;
    const base = { tenantId: user?.tenantId, type: labelType, fromAddress: fromAddr, toAddress: toAddr, referenceNumber: refNum || undefined, batchNumber: batch || undefined, lotNumber: lot || undefined, labelFormat };
    if (labelType === 'SHIPPING') generateMutation.mutate({ ...base, carrier, service, weight: +weight || 1, weightUnit, dimensions: dimL && dimW && dimH ? { l: +dimL, w: +dimW, h: +dimH, unit: dimUnit } : undefined, orderId: orderId || undefined, isReturn, signatureRequired: sigReq });
    else if (labelType === 'PALLET') generateMutation.mutate({ ...base, carrier: 'NONE', content, grossWeight: +grossWeight || 0, grossWeightUnit: grossUnit, units: +units || 0, unitsType, productionDate: prodDate || undefined, expiryDate: expiryDate || undefined });
    else if (labelType === 'HU')     generateMutation.mutate({ ...base, carrier: 'NONE', huNumber, materialNumber: matNumber, materialDescription: matDesc, quantity: +quantity || 0, quantityUnit: qtyUnit, deliveryNumber: delivery, plant, storageLocation: storageLoc });
    else                             generateMutation.mutate({ ...base, carrier: 'NONE', contents, cartonNumber: +cartonNum || 1, totalCartons: +totalCartons || 1, qtyPerCarton: +qtyPerCarton || 0, qtyUnit: boxQtyUnit, weight: +boxWeight || 0, weightUnit: 'KG' });
  };

  const canGenerate = (() => {
    if (labelType === 'CUSTOM') return false;
    if (!fromAddr.name || !toAddr.name) return false;
    if (labelType === 'SHIPPING') return !!(carrier && service && weight);
    if (labelType === 'PALLET')   return !!(content && grossWeight && units);
    if (labelType === 'HU')       return !!(huNumber && matNumber && quantity);
    if (labelType === 'BOX')      return !!(contents && totalCartons);
    return false;
  })();

  // ── Print ─────────────────────────────────────────────────────────
  const handlePrint = useCallback((lbl?: LabelData | null) => {
    const target = lbl ?? preview;
    if (!target) return;
    const dim = LABEL_DIMS[target.type ?? 'SHIPPING'];
    const svgEl = printRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const win = window.open('', '_blank', 'width=700,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Label — ${target.trackingNumber ?? target.huNumber ?? target.referenceNumber ?? ''}</title>
      <style>
        @page { margin: 5mm; size: ${dim.printW} ${dim.printH}; }
        body { margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#fff; }
        svg { width:${dim.printW}; height:${dim.printH}; }
      </style></head><body>${svgStr}
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),800);}<\/script>
      </body></html>`);
    win.document.close();
  }, [preview]);

  const dims   = LABEL_DIMS[(labelType === 'CUSTOM' ? 'SHIPPING' : labelType) as LabelType];
  const aspect = `${dims.W}/${dims.H}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Labels</h1>
          <p className="text-sm text-gray-500 mt-1">Generate, preview and print all label types</p>
        </div>
        {preview && (
          <button onClick={() => handlePrint()} className="flex items-center gap-2 rounded-lg bg-emerald-600 text-white text-sm px-4 py-2 font-medium hover:bg-emerald-700 transition-colors shadow-sm">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9h8v4H6v-4zm8-4a1 1 0 110 2 1 1 0 010-2z" clipRule="evenodd" />
            </svg>
            Print Label
          </button>
        )}
      </div>

      {/* Label type tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(Object.entries(LABEL_TYPES) as [PageLabelType, { label: string; icon: string; desc: string }][]).map(([t, meta]) => (
          <button key={t} onClick={() => handleTypeChange(t)}
            className={`rounded-xl border-2 p-3 text-left transition-all ${labelType === t ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className="text-lg mb-0.5">{meta.icon}</div>
            <div className={`text-sm font-semibold ${labelType === t ? 'text-emerald-700' : 'text-gray-700'}`}>{meta.label}</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-snug">{meta.desc}</div>
          </button>
        ))}
      </div>

      {/* ── CUSTOM: drag-and-drop designer ───────────────────────── */}
      {labelType === 'CUSTOM' && (
        <div className="card overflow-hidden" style={{ height: 600 }}>
          <LabelDesigner />
        </div>
      )}

      {/* Main grid: form + preview (non-custom types only) */}
      {labelType !== 'CUSTOM' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: Form ─────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* ── SHIPPING form sections ──────────────────────────── */}
          {labelType === 'SHIPPING' && (
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Carrier & Service</h3>
              <div className="flex gap-2 flex-wrap">
                {CARRIERS.map(c => (
                  <button key={c} onClick={() => handleCarrierChange(c)}
                    className={`text-xs px-3.5 py-1.5 rounded-full font-bold border-2 transition-all ${carrier === c ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Service level</label>
                <select className="input text-sm w-full" value={service} onChange={e => setService(e.target.value)}>
                  {CARRIER_SERVICES[carrier].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Label format</label>
                <div className="flex gap-2">
                  {LABEL_FORMATS.map(f => (
                    <button key={f} onClick={() => setLabelFormat(f)}
                      className={`text-xs px-3 py-1 rounded border font-medium transition-colors ${labelFormat === f ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Addresses (all types) ──────────────────────────── */}
          <div className="card p-5 space-y-5">
            <h3 className="text-sm font-semibold text-gray-700">Addresses</h3>
            <AddressBlock label="From (sender)" value={fromAddr} onChange={setFromAddr} />
            <div className="border-t border-gray-100" />
            <AddressBlock label="To (recipient)" value={toAddr} onChange={setToAddr} />
          </div>

          {/* ── SHIPPING: Package details ──────────────────────── */}
          {labelType === 'SHIPPING' && (
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Package Details</h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Weight <span className="text-red-500">*</span></label>
                  <input type="number" className="input text-sm w-full" placeholder="0.0" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                  <select className="input text-sm" value={weightUnit} onChange={e => setWeightUnit(e.target.value as 'LB' | 'KG')}><option>KG</option><option>LB</option></select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Dimensions (optional)</label>
                <div className="flex gap-2 items-center">
                  {[['L', dimL, setDimL], ['W', dimW, setDimW], ['H', dimH, setDimH]].map(([ph, v, set]) => (
                    <input key={ph as string} type="number" min="1" className="input text-sm w-16 text-center" placeholder={ph as string}
                      value={v as string} onChange={e => (set as (v: string) => void)(e.target.value)} />
                  ))}
                  <select className="input text-sm" value={dimUnit} onChange={e => setDimUnit(e.target.value as 'CM' | 'IN')}><option>CM</option><option>IN</option></select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reference #</label>
                  <input className="input text-sm w-full" placeholder="PO-2026-0041" value={refNum} onChange={e => setRefNum(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Order ID</label>
                  <input className="input text-sm w-full" placeholder="Optional" value={orderId} onChange={e => setOrderId(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-6 pt-1">
                <Toggle label="Return shipment"   value={isReturn} onChange={setIsReturn} />
                <Toggle label="Signature required" value={sigReq}   onChange={setSigReq} />
              </div>
            </div>
          )}

          {/* ── PALLET: details ───────────────────────────────── */}
          {labelType === 'PALLET' && (
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Pallet Details</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Content / Description <span className="text-red-500">*</span></label>
                <input className="input text-sm w-full" placeholder="e.g. Electronic Connectors" value={content} onChange={e => setContent(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Gross Weight <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input type="number" className="input text-sm flex-1" placeholder="0.0" value={grossWeight} onChange={e => setGrossWeight(e.target.value)} />
                    <select className="input text-sm" value={grossUnit} onChange={e => setGrossUnit(e.target.value as 'KG' | 'LB')}><option>KG</option><option>LB</option></select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">No. of HUs <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input type="number" className="input text-sm flex-1" placeholder="0" value={units} onChange={e => setUnits(e.target.value)} />
                    <select className="input text-sm" value={unitsType} onChange={e => setUnitsType(e.target.value)}>
                      {UNITS_TYPES.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Batch / Lot</label>
                  <input className="input text-sm w-full" placeholder="BATCH-2026-017" value={batch} onChange={e => setBatch(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">PO Reference</label>
                  <input className="input text-sm w-full" placeholder="PO-2026-0041" value={refNum} onChange={e => setRefNum(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Production Date</label>
                  <input type="date" className="input text-sm w-full" value={prodDate} onChange={e => setProdDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                  <input type="date" className="input text-sm w-full" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ── HU: details ───────────────────────────────────── */}
          {labelType === 'HU' && (
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Handling Unit Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">HU Number <span className="text-red-500">*</span></label>
                  <input className="input text-sm w-full" placeholder="HU-2026-0001" value={huNumber} onChange={e => setHuNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Material No. <span className="text-red-500">*</span></label>
                  <input className="input text-sm w-full" placeholder="MAT-001234" value={matNumber} onChange={e => setMatNumber(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Material Description</label>
                <input className="input text-sm w-full" placeholder="Electronic Connector, 5-pin" value={matDesc} onChange={e => setMatDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Quantity <span className="text-red-500">*</span></label>
                  <input type="number" className="input text-sm w-full" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                  <select className="input text-sm w-full" value={qtyUnit} onChange={e => setQtyUnit(e.target.value)}>
                    {QTY_UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Batch / Lot</label>
                  <input className="input text-sm w-full" placeholder="LOT-2026-B47" value={batch} onChange={e => setBatch(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Delivery No.</label>
                  <input className="input text-sm w-full" placeholder="DEL-2026-001" value={delivery} onChange={e => setDelivery(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Plant</label>
                  <input className="input text-sm w-full" placeholder="1000" value={plant} onChange={e => setPlant(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Storage Location</label>
                  <input className="input text-sm w-full" placeholder="WH-01-A-04" value={storageLoc} onChange={e => setStorageLoc(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">PO Reference</label>
                <input className="input text-sm w-full" placeholder="PO-2026-0041" value={refNum} onChange={e => setRefNum(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── BOX: details ──────────────────────────────────── */}
          {labelType === 'BOX' && (
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Box / Carton Details</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Contents <span className="text-red-500">*</span></label>
                <input className="input text-sm w-full" placeholder="e.g. Electronic Connectors" value={contents} onChange={e => setContents(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Carton No.</label>
                  <input type="number" min="1" className="input text-sm w-full" placeholder="1" value={cartonNum} onChange={e => setCartonNum(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Total Cartons <span className="text-red-500">*</span></label>
                  <input type="number" min="1" className="input text-sm w-full" placeholder="24" value={totalCartons} onChange={e => setTotalCartons(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Qty per Carton</label>
                  <input type="number" className="input text-sm w-full" placeholder="50" value={qtyPerCarton} onChange={e => setQtyPerCarton(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                  <select className="input text-sm w-full" value={boxQtyUnit} onChange={e => setBoxQtyUnit(e.target.value)}>
                    {QTY_UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Weight (KG)</label>
                  <input type="number" className="input text-sm w-full" placeholder="5.2" value={boxWeight} onChange={e => setBoxWeight(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Batch / Lot</label>
                  <input className="input text-sm w-full" placeholder="LOT-B47" value={batch} onChange={e => setBatch(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">PO Reference</label>
                <input className="input text-sm w-full" placeholder="PO-2026-0041" value={refNum} onChange={e => setRefNum(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Label format for non-shipping ─────────────────── */}
          {labelType !== 'SHIPPING' && (
            <div className="card p-4 flex items-center gap-4">
              <span className="text-xs font-medium text-gray-500">Label format</span>
              <div className="flex gap-2">
                {LABEL_FORMATS.map(f => (
                  <button key={f} onClick={() => setLabelFormat(f)}
                    className={`text-xs px-3 py-1 rounded border font-medium transition-colors ${labelFormat === f ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400 ml-auto">{dims.printW} × {dims.printH}</span>
            </div>
          )}

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={!canGenerate || generateMutation.isPending}
            className="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
            {generateMutation.isPending ? 'Generating…' : `✦ Generate ${LABEL_TYPES[labelType].label} Label`}
          </button>
          {generateMutation.isError && (
            <p className="text-sm text-red-600 text-center">Generation failed — check required fields.</p>
          )}
        </div>

        {/* ── RIGHT: Preview ──────────────────────────────────── */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                {preview ? `${LABEL_TYPES[preview.type ?? 'SHIPPING'].icon} Generated Label` : `${LABEL_TYPES[labelType].icon} Live Preview`}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{dims.printW} × {dims.printH}</span>
                {preview && (
                  <>
                    {preview.rateCharged != null && (
                      <span className="text-xs text-gray-400">Rate: <strong className="text-gray-700">${preview.rateCharged.toFixed(2)}</strong></span>
                    )}
                    <button onClick={() => handlePrint()} className="text-xs text-emerald-700 hover:text-emerald-800 font-medium underline">Print</button>
                  </>
                )}
              </div>
            </div>

            {/* SVG preview */}
            <div ref={printRef} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center"
              style={{ aspectRatio: aspect }}>
              <LabelPreview label={preview ?? livePreview} />
            </div>

            {/* Generated label metadata */}
            {preview && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {preview.trackingNumber && preview.trackingNumber !== 'PREVIEW-ONLY' && (
                  <div className="col-span-2">
                    <span className="text-xs text-gray-400 block">Tracking #</span>
                    <span className="font-mono font-semibold text-emerald-700">{preview.trackingNumber}</span>
                  </div>
                )}
                {preview.huNumber && (
                  <div><span className="text-xs text-gray-400 block">HU Number</span>
                    <span className="font-mono font-semibold text-cyan-700">{preview.huNumber}</span></div>
                )}
                {preview.sscc && (
                  <div className="col-span-2"><span className="text-xs text-gray-400 block">SSCC-18</span>
                    <span className="font-mono text-xs">{preview.sscc}</span></div>
                )}
                {preview.carrier && (
                  <div><span className="text-xs text-gray-400 block">Carrier</span>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded font-bold ${CARRIER_BADGE[preview.carrier] ?? 'bg-gray-100 text-gray-700'}`}>{preview.carrier}</span></div>
                )}
                {preview.shipDate && (
                  <div><span className="text-xs text-gray-400 block">Ship Date</span>
                    <span>{new Date(preview.shipDate).toLocaleDateString()}</span></div>
                )}
                {preview.estimatedDelivery && (
                  <div><span className="text-xs text-gray-400 block">Est. Delivery</span>
                    <span>{new Date(preview.estimatedDelivery).toLocaleDateString()}</span></div>
                )}
              </div>
            )}
          </div>

          {!preview && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs text-emerald-800 leading-relaxed">
              <p className="font-semibold mb-0.5">How it works</p>
              Select a label type above, fill in the form fields, then click <strong>Generate</strong>.
              A print-ready label is rendered with a unique ID. Click <strong>Print Label</strong> to send to your label printer.
            </div>
          )}
        </div>
      </div>}

      {/* ── History ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-gray-900">Label History</h2>
          <div className="flex gap-1.5 flex-wrap">
            {['', ...CARRIERS].map(c => (
              <button key={c} onClick={() => setHistoryFilter(c)}
                className={`text-xs px-3 py-1 rounded-full font-medium border transition-colors ${historyFilter === c ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                {c || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Type', 'ID / Tracking', 'Carrier', 'To', 'Details', 'Created', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {historyLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : !historyData?.data?.length ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No labels generated yet.</td></tr>
              ) : historyData.data.map((lbl) => {
                const lType = (lbl.type ?? 'SHIPPING') as LabelType;
                const idStr = lbl.trackingNumber && lbl.trackingNumber !== 'PREVIEW-ONLY'
                  ? lbl.trackingNumber : lbl.huNumber ?? lbl.sscc ?? lbl.referenceNumber ?? '—';
                const detail = lType === 'SHIPPING'
                  ? `${lbl.weight ?? '—'} ${lbl.weightUnit ?? ''}`
                  : lType === 'PALLET'
                  ? `${lbl.units ?? '—'} ${lbl.unitsType ?? ''} · ${lbl.grossWeight ?? '—'} ${lbl.grossWeightUnit ?? ''}`
                  : lType === 'HU'
                  ? `${lbl.quantity ?? '—'} ${lbl.quantityUnit ?? ''} · ${lbl.materialNumber ?? '—'}`
                  : `CTN ${lbl.cartonNumber ?? '—'} of ${lbl.totalCartons ?? '—'}`;

                return (
                  <tr key={lbl.id} className={`hover:bg-gray-50 cursor-pointer ${preview?.id === lbl.id ? 'bg-emerald-50' : ''}`}
                    onClick={() => setPreview(lbl)}>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${TYPE_BADGE[lType]}`}>{LABEL_TYPES[lType].icon} {LABEL_TYPES[lType].label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-emerald-700">{idStr}</span>
                    </td>
                    <td className="px-4 py-3">
                      {lbl.carrier && lbl.carrier !== 'NONE'
                        ? <span className={`text-xs px-2 py-0.5 rounded font-bold ${CARRIER_BADGE[lbl.carrier] ?? 'bg-gray-100 text-gray-700'}`}>{lbl.carrier}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {lbl.toAddress?.city}{lbl.toAddress?.country ? `, ${lbl.toAddress.country}` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{detail}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(lbl.createdAt ?? '').toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); setPreview(lbl); setTimeout(() => handlePrint(lbl), 50); }}
                        className="text-gray-400 hover:text-emerald-600 transition-colors" title="Print">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9h8v4H6v-4zm8-4a1 1 0 110 2 1 1 0 010-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {historyData?.meta && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              {historyData.meta.total} label{historyData.meta.total !== 1 ? 's' : ''} total
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
