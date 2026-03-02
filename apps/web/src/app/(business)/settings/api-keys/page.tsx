'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt?: string;
  createdAt: string;
}

const ALL_SCOPES = [
  { key: 'documents:read',  label: 'Documents — Read' },
  { key: 'documents:write', label: 'Documents — Write' },
  { key: 'partners:read',   label: 'Partners — Read' },
  { key: 'partners:write',  label: 'Partners — Write' },
  { key: 'shipments:read',  label: 'Shipments — Read' },
  { key: 'tracking:read',   label: 'Tracking — Read' },
  { key: 'webhooks:manage', label: 'Webhooks — Manage' },
  { key: 'analytics:read',  label: 'Analytics — Read' },
];

const EXPIRY_OPTIONS = [
  { value: '',    label: 'Never expires' },
  { value: '30',  label: '30 days' },
  { value: '90',  label: '90 days' },
  { value: '365', label: '1 year' },
];

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['documents:read']);
  const [expiry, setExpiry] = useState('');

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: () => apiClient.get('/api-keys').then((r) => r.data?.data ?? r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/api-keys', { name: keyName, scopes: selectedScopes, expiresInDays: expiry ? Number(expiry) : undefined }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      setNewKey(res.data.key);
      setShowNew(false);
      setKeyName('');
      setSelectedScopes(['documents:read']);
      setExpiry('');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api-keys/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); setRevokeId(null); },
  });

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const copyKey = async () => {
    if (newKey) {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">Programmatic access to your SupplyForge account</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ Create New Key</button>
      </div>

      {/* Info banner */}
      <div className="card p-4 border-l-4 border-yellow-400 bg-yellow-50/50 flex gap-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <p className="text-sm text-yellow-800">
          API keys grant full programmatic access based on their scopes. Store them securely and never share them publicly.
          Keys are shown <strong>only once</strong> when created.
        </p>
      </div>

      {/* Keys table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Prefix', 'Scopes', 'Last Used', 'Created', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : keys.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">No API keys yet. Create one to get started.</td></tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{k.name}</td>
                  <td className="px-5 py-3.5">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{k.prefix}••••</code>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.slice(0, 3).map((s) => (
                        <span key={s} className="text-xs bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                      {k.scopes.length > 3 && <span className="text-xs text-gray-400">+{k.scopes.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setRevokeId(k.id)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 transition-colors">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Key Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Create API Key</h3>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                <input value={keyName} onChange={(e) => setKeyName(e.target.value)} className="input" placeholder="e.g. Production ERP Integration" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {ALL_SCOPES.map((s) => (
                    <label key={s.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(s.key)}
                        onChange={() => toggleScope(s.key)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className="input">
                  {EXPIRY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowNew(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!keyName || selectedScopes.length === 0 || createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Key Display Modal */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Your New API Key</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-xs font-medium text-yellow-800">
                  ⚠️ Copy this key now. You won&apos;t be able to see it again.
                </p>
              </div>
              <div className="flex gap-2">
                <code className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 break-all select-all">
                  {newKey}
                </code>
                <button onClick={copyKey} className="btn-secondary text-sm flex-shrink-0">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end">
              <button onClick={() => { setNewKey(null); setCopied(false); }} className="btn-primary">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirm Modal */}
      {revokeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Revoke API Key</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600">
                This will immediately invalidate the key. Any integrations using it will stop working.
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setRevokeId(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => revokeMutation.mutate(revokeId)}
                disabled={revokeMutation.isPending}
                className="rounded-lg bg-red-600 text-white text-sm px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {revokeMutation.isPending ? 'Revoking...' : 'Revoke Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
