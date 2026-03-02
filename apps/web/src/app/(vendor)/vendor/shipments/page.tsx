'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ShipmentEvent {
  status: string; description: string; location: string; timestamp: string;
}

interface Shipment {
  id: string; carrier: string; trackingNumber: string; status: string;
  estimatedDelivery?: string; actualDelivery?: string;
  origin: { city: string; country: string };
  destination: { city: string; country: string };
  createdAt: string;
  events: ShipmentEvent[];
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:     'badge-draft',
  IN_TRANSIT:  'badge-sent',
  DELIVERED:   'badge-accepted',
  DELAYED:     'badge-rejected',
  OUT_FOR_DEL: 'badge-acknowledged',
  BOOKED:      'badge-draft',
  PICKED_UP:   'badge-sent',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', IN_TRANSIT: 'In Transit', DELIVERED: 'Delivered',
  DELAYED: 'Delayed', OUT_FOR_DEL: 'Out for Delivery', BOOKED: 'Booked', PICKED_UP: 'Picked Up',
};

const CARRIER_COLOR: Record<string, string> = {
  FEDEX: 'bg-purple-100 text-purple-700',
  UPS:   'bg-amber-100 text-amber-700',
  DHL:   'bg-yellow-100 text-yellow-800',
  USPS:  'bg-blue-100 text-blue-700',
};

const CARRIERS = ['FEDEX', 'UPS', 'DHL', 'USPS'];

export default function VendorShipmentsPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showASN, setShowASN] = useState(false);
  const [asnForm, setAsnForm] = useState({
    carrier: 'FEDEX',
    trackingNumber: '',
    shipDate: new Date().toISOString().split('T')[0],
    estimatedDelivery: '',
    originCity: '', originCountry: 'DE',
    destCity: '', destCountry: 'US',
    poReference: '',
    contents: '',
  });

  const { data, isLoading } = useQuery<{ data: Shipment[]; meta: { total: number } }>({
    queryKey: ['vendor-shipments', filterStatus],
    queryFn: () =>
      apiClient.get('/shipments', {
        params: { status: filterStatus || undefined, limit: 50 },
      }).then((r) => r.data),
  });

  const createASN = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiClient.post('/documents', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-shipments'] });
      setShowASN(false);
      setAsnForm({
        carrier: 'FEDEX', trackingNumber: '', shipDate: new Date().toISOString().split('T')[0],
        estimatedDelivery: '', originCity: '', originCountry: 'DE',
        destCity: '', destCountry: 'US', poReference: '', contents: '',
      });
    },
  });

  const shipments = data?.data ?? [];
  const inTransit  = shipments.filter((s) => ['IN_TRANSIT', 'OUT_FOR_DEL', 'PICKED_UP'].includes(s.status)).length;
  const delivered  = shipments.filter((s) => s.status === 'DELIVERED').length;
  const pending    = shipments.filter((s) => ['PENDING', 'BOOKED'].includes(s.status)).length;
  const delayed    = shipments.filter((s) => s.status === 'DELAYED').length;

  const statusFilters = ['', 'IN_TRANSIT', 'DELIVERED', 'PENDING', 'DELAYED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Shipments</h1>
          <p className="page-subtitle">Track shipments and create advance ship notices</p>
        </div>
        <button
          onClick={() => setShowASN(true)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#0070F2' }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create ASN
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'In Transit',     value: inTransit, accent: 'accent-blue',   color: 'text-[#0070F2]', dot: <span className="live-dot-blue" /> },
          { label: 'Delivered',      value: delivered, accent: 'accent-green',  color: 'text-[#107E3E]', dot: null },
          { label: 'Pending Pickup', value: pending,   accent: 'accent-amber',  color: 'text-[#E9730C]', dot: null },
          { label: 'Delayed',        value: delayed,   accent: delayed > 0 ? 'accent-red' : 'accent-green', color: delayed > 0 ? 'text-[#BB0000]' : 'text-[#107E3E]', dot: delayed > 0 ? <span className="live-dot-red" /> : null },
        ].map(({ label, value, accent, color, dot }) => (
          <div key={label} className={`stat-card ${accent} p-5`}>
            <div className="flex items-center gap-2 mb-2">
              {dot}
              <div className="text-xs text-[#6A6D70] font-bold uppercase tracking-wide">{label}</div>
            </div>
            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              filterStatus === s ? 'bg-[#0070F2] text-white border-[#0070F2]' : 'bg-white text-[#32363A] border-[#EDEDED] hover:border-gray-400'
            }`}>
            {s ? (STATUS_LABEL[s] ?? s) : 'All'}
          </button>
        ))}
      </div>

      {/* Shipments table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-[#EDEDED]">
          <thead className="bg-[#F5F6F7]">
            <tr>
              {['Tracking #', 'Carrier', 'Status', 'Route', 'ETA', 'Shipped', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-[#6A6D70] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#F5F6F7]">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : !shipments.length ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1H5V5a1 1 0 00-1-1H3zM14 7a1 1 0 011 1v1h2.05A2.5 2.5 0 0119 11.5V14a1 1 0 01-1 1h-1.05a2.5 2.5 0 01-4.9 0H11V8a1 1 0 011-1h2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#6A6D70]">No shipments found</p>
                  <button onClick={() => setShowASN(true)} className="mt-2 text-xs text-[#0070F2] hover:underline">Create your first ASN</button>
                </td>
              </tr>
            ) : (
              shipments.map((ship) => (
                <>
                  <tr key={ship.id} className="hover:bg-[#F5F6F7] cursor-pointer"
                    onClick={() => setExpanded(expanded === ship.id ? null : ship.id)}>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-mono font-medium text-[#32363A]">{ship.trackingNumber}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${CARRIER_COLOR[ship.carrier] ?? 'bg-gray-100 text-gray-700'}`}>
                        {ship.carrier}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={STATUS_BADGE[ship.status] ?? 'badge-draft'}>
                        {STATUS_LABEL[ship.status] ?? ship.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#32363A]">
                      {ship.origin.city}, {ship.origin.country}
                      <span className="mx-1 text-[#6A6D70]">→</span>
                      {ship.destination.city}, {ship.destination.country}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#32363A]">
                      {ship.actualDelivery
                        ? <span className="text-[#107E3E] font-medium">Delivered {new Date(ship.actualDelivery).toLocaleDateString()}</span>
                        : ship.estimatedDelivery ? new Date(ship.estimatedDelivery).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6A6D70]">
                      {new Date(ship.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <svg viewBox="0 0 20 20" fill="currentColor"
                        className={`w-4 h-4 text-[#6A6D70] transition-transform ${expanded === ship.id ? 'rotate-180' : ''}`}>
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </td>
                  </tr>

                  {expanded === ship.id && ship.events.length > 0 && (
                    <tr key={`${ship.id}-events`} className="bg-[#F5F6F7]">
                      <td colSpan={7} className="px-8 py-4">
                        <div className="text-xs font-semibold text-[#6A6D70] mb-3 uppercase tracking-wide">Tracking History</div>
                        <ol className="relative border-l border-[#EDEDED] ml-3 space-y-3">
                          {[...ship.events].reverse().map((ev, i) => (
                            <li key={i} className="pl-6">
                              <span className="absolute left-0 w-2 h-2 bg-[#0070F2] rounded-full mt-1 -translate-x-[3px]" />
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-[#32363A]">{ev.description}</p>
                                  <p className="text-[11px] text-[#6A6D70]">{ev.location}</p>
                                </div>
                                <p className="text-[11px] text-[#6A6D70] flex-shrink-0">
                                  {new Date(ev.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
        {data?.meta && (
          <div className="px-5 py-3 bg-[#F5F6F7] border-t border-[#EDEDED] text-xs text-[#6A6D70]">
            {data.meta.total} total shipment{data.meta.total !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Create ASN Modal */}
      {showASN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[#EDEDED] flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="font-semibold text-[#32363A]">Create Advance Ship Notice</h3>
                <p className="text-xs text-[#6A6D70] mt-0.5">Notify your buyer of an upcoming shipment</p>
              </div>
              <button onClick={() => setShowASN(false)} className="text-[#6A6D70] hover:text-[#32363A] text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Carrier *</label>
                  <select className="input w-full text-sm" value={asnForm.carrier}
                    onChange={(e) => setAsnForm((f) => ({ ...f, carrier: e.target.value }))}>
                    {CARRIERS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Tracking Number *</label>
                  <input className="input w-full text-sm font-mono" placeholder="1Z999AA10123456784"
                    value={asnForm.trackingNumber}
                    onChange={(e) => setAsnForm((f) => ({ ...f, trackingNumber: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Ship Date *</label>
                  <input type="date" className="input w-full text-sm" value={asnForm.shipDate}
                    onChange={(e) => setAsnForm((f) => ({ ...f, shipDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Est. Delivery</label>
                  <input type="date" className="input w-full text-sm" value={asnForm.estimatedDelivery}
                    onChange={(e) => setAsnForm((f) => ({ ...f, estimatedDelivery: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Origin City</label>
                  <input className="input w-full text-sm" placeholder="Munich"
                    value={asnForm.originCity}
                    onChange={(e) => setAsnForm((f) => ({ ...f, originCity: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Origin Country</label>
                  <input className="input w-full text-sm" placeholder="DE"
                    value={asnForm.originCountry}
                    onChange={(e) => setAsnForm((f) => ({ ...f, originCountry: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Destination City</label>
                  <input className="input w-full text-sm" placeholder="Chicago"
                    value={asnForm.destCity}
                    onChange={(e) => setAsnForm((f) => ({ ...f, destCity: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#32363A] mb-1">Destination Country</label>
                  <input className="input w-full text-sm" placeholder="US"
                    value={asnForm.destCountry}
                    onChange={(e) => setAsnForm((f) => ({ ...f, destCountry: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#32363A] mb-1">PO Reference</label>
                <input className="input w-full text-sm" placeholder="PO-2026-XXXX"
                  value={asnForm.poReference}
                  onChange={(e) => setAsnForm((f) => ({ ...f, poReference: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#32363A] mb-1">Contents Description</label>
                <textarea className="input w-full text-sm h-16 resize-none" placeholder="PCBs, connectors, 150 units..."
                  value={asnForm.contents}
                  onChange={(e) => setAsnForm((f) => ({ ...f, contents: e.target.value }))} />
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-3 justify-end border-t border-[#EDEDED] pt-4">
              <button onClick={() => setShowASN(false)} className="btn-secondary text-sm">Cancel</button>
              <button
                disabled={!asnForm.carrier || !asnForm.trackingNumber || !asnForm.shipDate || createASN.isPending}
                onClick={() => createASN.mutate({
                  type: 'ASN',
                  referenceNumber: `ASN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
                  currency: 'USD',
                  carrier: asnForm.carrier,
                  trackingNumber: asnForm.trackingNumber,
                  shipDate: asnForm.shipDate,
                  estimatedDelivery: asnForm.estimatedDelivery || undefined,
                  contents: asnForm.contents || undefined,
                  poReference: asnForm.poReference || undefined,
                })}
                className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-40 transition-colors"
                style={{ backgroundColor: '#0070F2' }}
              >
                {createASN.isPending ? 'Submitting…' : 'Submit ASN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
