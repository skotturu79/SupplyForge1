'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastDeliveryAt?: string;
  failureCount: number;
}

const ALL_EVENTS = [
  { key: 'document.created',        label: 'Document Created' },
  { key: 'document.status_changed', label: 'Document Status Changed' },
  { key: 'connection.approved',     label: 'Connection Approved' },
  { key: 'shipment.updated',        label: 'Shipment Updated' },
  { key: 'invoice.matched',         label: 'Invoice Matched' },
];

function generateSecret(len = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

interface WebhookFormState {
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
}

const defaultForm = (): WebhookFormState => ({
  url: '', secret: generateSecret(), events: ['document.created', 'document.status_changed'], isActive: true,
});

export default function WebhooksPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<WebhookFormState>(defaultForm());

  const { data: webhooks = [], isLoading } = useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: () => apiClient.get('/webhooks').then((r) => r.data?.data ?? r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editingId
        ? apiClient.patch(`/webhooks/${editingId}`, form)
        : apiClient.post('/webhooks', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); setShowForm(false); setEditingId(null); setForm(defaultForm()); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/webhooks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); setDeleteId(null); },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/webhooks/${id}/test`),
    onSuccess: (_, id) => setTestResults((r) => ({ ...r, [id]: true })),
    onError: (_, id) => setTestResults((r) => ({ ...r, [id]: false })),
  });

  const openEdit = (wh: Webhook) => {
    setForm({ url: wh.url, secret: '', events: wh.events, isActive: wh.isActive });
    setEditingId(wh.id);
    setShowForm(true);
  };

  const toggleEvent = (ev: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-sm text-gray-500 mt-1">Receive real-time event notifications to your endpoints</p>
        </div>
        <button onClick={() => { setForm(defaultForm()); setEditingId(null); setShowForm(true); }} className="btn-primary">
          + Add Endpoint
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 border-l-4 border-brand-500 bg-brand-50/50">
        <p className="text-sm text-brand-800">
          <strong>Signature verification:</strong> Every webhook payload includes an{' '}
          <code className="text-xs bg-brand-100 px-1 py-0.5 rounded">X-SupplyForge-Signature</code>{' '}
          header signed with HMAC-SHA256 using your endpoint secret.
        </p>
      </div>

      {/* Webhook cards */}
      {isLoading ? (
        <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="card p-5 h-32 animate-pulse bg-gray-50" />)}</div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">⚡</div>
          <p className="text-sm text-gray-500">No webhook endpoints configured.</p>
          <button onClick={() => { setForm(defaultForm()); setShowForm(true); }} className="mt-4 text-sm text-brand-600 hover:text-brand-700 underline">
            Add your first endpoint
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((wh) => (
            <div key={wh.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${wh.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{wh.url}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {wh.lastDeliveryAt ? `Last delivery: ${new Date(wh.lastDeliveryAt).toLocaleString()}` : 'No deliveries yet'}
                      {wh.failureCount > 0 && <span className="ml-2 text-red-500">{wh.failureCount} failures</span>}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {wh.events.map((ev) => (
                        <span key={ev} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{ev}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => testMutation.mutate(wh.id)}
                    disabled={testMutation.isPending}
                    className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${
                      testResults[wh.id] === true  ? 'bg-green-50 text-green-700 border-green-200' :
                      testResults[wh.id] === false ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {testResults[wh.id] === true ? '✓ OK' : testResults[wh.id] === false ? '✗ Failed' : 'Test'}
                  </button>
                  <button onClick={() => openEdit(wh)} className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:border-gray-300 font-medium transition-colors">
                    Edit
                  </button>
                  <button onClick={() => setDeleteId(wh.id)} className="text-xs px-2.5 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Edit Webhook' : 'New Webhook Endpoint'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  className="input"
                  placeholder="https://your-app.com/webhooks/supplyforge"
                  type="url"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Signing Secret</label>
                  <button onClick={() => setForm((f) => ({ ...f, secret: generateSecret() }))} className="text-xs text-brand-600 hover:text-brand-700">
                    Generate new
                  </button>
                </div>
                <input
                  value={form.secret}
                  onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                  className="input font-mono text-xs"
                  placeholder="min 20 characters"
                />
                <p className="text-xs text-gray-400 mt-1">Min 20 characters. Used for HMAC-SHA256 signature verification.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events to Subscribe</label>
                <div className="space-y-1.5">
                  {ALL_EVENTS.map((ev) => (
                    <label key={ev.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={form.events.includes(ev.key)}
                        onChange={() => toggleEvent(ev.key)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700">{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-brand-600"
                />
                <span className="text-sm text-gray-700">Active (receive events immediately)</span>
              </label>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!form.url || form.secret.length < 20 || form.events.length === 0 || saveMutation.isPending}
                className="btn-primary"
              >
                {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Create Endpoint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Delete Webhook</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600">This endpoint will no longer receive events. This cannot be undone.</p>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 text-white text-sm px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
