'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ShipmentEvent {
  id: string;
  status: string;
  location: string;
  description: string;
  occurredAt: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: string;
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  status: string;
  eta?: string;
  poReference?: string;
  events: ShipmentEvent[];
}

const STATUS_FILTERS = ['', 'BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'];

const statusStyle: Record<string, string> = {
  BOOKED:           'bg-gray-100 text-gray-700',
  PICKED_UP:        'bg-blue-100 text-blue-700',
  IN_TRANSIT:       'bg-yellow-100 text-yellow-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED:        'bg-green-100 text-green-700',
  EXCEPTION:        'bg-red-100 text-red-700',
};

const eventDot: Record<string, string> = {
  BOOKED:           'bg-gray-400',
  PICKED_UP:        'bg-blue-500',
  IN_TRANSIT:       'bg-yellow-500',
  OUT_FOR_DELIVERY: 'bg-purple-500',
  DELIVERED:        'bg-green-500',
  EXCEPTION:        'bg-red-500',
};

export default function TrackingPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [quickTrack, setQuickTrack] = useState('');
  const [trackQuery, setTrackQuery] = useState('');
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: Shipment[]; meta: { total: number; hasMore: boolean } }>({
    queryKey: ['shipments', statusFilter, trackQuery, page],
    queryFn: () =>
      apiClient.get('/shipments', {
        params: {
          status: statusFilter || undefined,
          trackingNumber: trackQuery || undefined,
          page,
          limit: 20,
        },
      }).then((r) => r.data),
  });

  const shipments = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor your shipments in real time</p>
      </div>

      {/* Quick track */}
      <div className="card p-4 flex gap-3">
        <input
          value={quickTrack}
          onChange={(e) => setQuickTrack(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setTrackQuery(quickTrack); setStatusFilter(''); setPage(1); }}}
          className="input flex-1"
          placeholder="Enter tracking number or PO reference..."
        />
        <button
          onClick={() => { setTrackQuery(quickTrack); setStatusFilter(''); setPage(1); }}
          className="btn-primary"
        >
          Track
        </button>
        {trackQuery && (
          <button
            onClick={() => { setQuickTrack(''); setTrackQuery(''); }}
            className="btn-secondary"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setTrackQuery(''); setQuickTrack(''); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              statusFilter === s && !trackQuery
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Tracking #', 'Carrier', 'Route', 'Status', 'ETA', 'PO Ref', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center">
                  <div className="text-4xl mb-3">🚚</div>
                  <p className="text-sm text-gray-500">No shipments found.</p>
                </td>
              </tr>
            ) : (
              shipments.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono text-sm font-medium text-gray-900">
                    {s.trackingNumber}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{s.carrier}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">
                    <span>{s.originCity}, {s.originCountry}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span>{s.destCity}, {s.destCountry}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[s.status] || 'bg-gray-100 text-gray-700'}`}>
                      {s.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {s.eta ? new Date(s.eta).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{s.poReference || '—'}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setSelected(s)}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {data?.meta && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{data.meta.total} shipments</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="btn-secondary text-xs py-1 px-2">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={!data.meta.hasMore} className="btn-secondary text-xs py-1 px-2">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail / Timeline Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900 font-mono">{selected.trackingNumber}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selected.carrier}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">From</span>
                  <span className="font-medium">{selected.originCity}, {selected.originCountry}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">To</span>
                  <span className="font-medium">{selected.destCity}, {selected.destCountry}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Status</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[selected.status] || ''}`}>
                    {selected.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">ETA</span>
                  <span className="font-medium">{selected.eta ? new Date(selected.eta).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Event Timeline</p>
              {selected.events.length === 0 ? (
                <p className="text-sm text-gray-400">No events recorded yet.</p>
              ) : (
                <div className="space-y-0">
                  {selected.events.map((ev, idx) => (
                    <div key={ev.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${eventDot[ev.status] || 'bg-gray-400'}`} />
                        {idx < selected.events.length - 1 && (
                          <div className="w-0.5 bg-gray-200 flex-1 my-1" />
                        )}
                      </div>
                      <div className={`pb-4 ${idx < selected.events.length - 1 ? '' : ''}`}>
                        <p className="text-xs font-medium text-gray-700">{ev.status.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{ev.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{ev.location} · {new Date(ev.occurredAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 pb-5 flex justify-end border-t border-gray-100 pt-4 flex-shrink-0">
              <button onClick={() => setSelected(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
