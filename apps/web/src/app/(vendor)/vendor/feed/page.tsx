'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface FeedSubscription {
  id: string;
  feedTypes: string[];
  deliveryMethod: string;
  webhookUrl?: string;
  isActive: boolean;
  lastDeliveredAt?: string;
  connection?: {
    requester?: { name: string };
    target?: { name: string };
  };
}

const deliveryIcons: Record<string, React.ReactNode> = {
  WEBHOOK: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" /></svg>,
  API_POLL: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>,
  SFTP:     <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>,
  AS2:      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>,
};

const feedTypeLabels: Record<string, string> = {
  inventory: 'Inventory', orders: 'Orders',
  shipments: 'Shipments', prices: 'Pricing', capacity: 'Capacity',
};

export default function VendorFeedPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  // New feed form state
  const [feedTypes, setFeedTypes]         = useState<string[]>(['inventory']);
  const [deliveryMethod, setDelivery]     = useState('WEBHOOK');
  const [webhookUrl, setWebhookUrl]       = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [partnerTenantId, setPartnerId]   = useState('');

  const { data: connections } = useQuery<Array<{ id: string; requesterTenantId: string; targetTenantId: string; requester: { id: string; name: string }; target: { id: string; name: string }; status: string }>>({
    queryKey: ['vendor-connections'],
    queryFn: () => apiClient.get('/partners').then((r) => r.data?.data ?? r.data),
  });

  const approvedConnections = connections?.filter((c) => c.status === 'APPROVED') ?? [];

  // Simulated feed subscriptions (real endpoint: /feed-subscriptions)
  const { data: subscriptions, isLoading } = useQuery<FeedSubscription[]>({
    queryKey: ['feed-subscriptions'],
    queryFn: () => apiClient.get('/partners').then(() => [] as FeedSubscription[]), // placeholder
  });

  const subscribeMutation = useMutation({
    mutationFn: (payload: object) => apiClient.post('/feed-subscriptions', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed-subscriptions'] });
      setShowNew(false);
    },
  });

  const toggleFeedType = (t: string) => {
    setFeedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Feed</h1>
          <p className="text-sm text-gray-500 mt-1">
            Control what data you push to each business partner
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          + New Subscription
        </button>
      </div>

      {/* Data sharing explainer */}
      <div className="card p-5 border-l-4 border-emerald-500 bg-emerald-50/50">
        <h3 className="font-semibold text-emerald-900 text-sm mb-2">How Data Feeds Work</h3>
        <p className="text-sm text-emerald-800">
          Data feeds let you push live updates (inventory levels, pricing, order capacity) to approved
          partners. Each partner receives only the data types they have permission to access based on
          your connection configuration. Deliveries happen via webhook, API polling, SFTP, or AS2.
        </p>
      </div>

      {/* Feed Type Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Object.entries(feedTypeLabels).map(([type, label]) => (
          <div key={type} className="card p-4 text-center">
            <div className="w-9 h-9 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center mx-auto mb-2">
              {type === 'inventory' ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
              ) : type === 'orders' ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>
              ) : type === 'shipments' ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1H5V5a1 1 0 00-1-1H3zM14 7a1 1 0 011 1v1h2.05A2.5 2.5 0 0119 11.5V14a1 1 0 01-1 1h-1.05a2.5 2.5 0 01-4.9 0H11V8a1 1 0 011-1h2z"/></svg>
              ) : type === 'prices' ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
              )}
            </div>
            <div className="text-xs font-semibold text-gray-700">{label}</div>
            <div className="text-xs text-gray-400 mt-1">
              {type === 'inventory' ? 'Stock levels & locations'
                : type === 'orders' ? 'Order history & status'
                : type === 'shipments' ? 'Tracking data'
                : type === 'prices' ? 'Price lists & discounts'
                : 'Available capacity'}
            </div>
          </div>
        ))}
      </div>

      {/* Active Subscriptions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Active Subscriptions</h2>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}
          </div>
        ) : !subscriptions?.length ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                <path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z"/>
                <path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1zM3 15a2 2 0 114 0 2 2 0 01-4 0z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-500">No active feed subscriptions.</p>
            <p className="text-xs text-gray-400 mt-1">
              Create a subscription to start pushing data to a partner.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 underline"
            >
              Create your first subscription
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                  {deliveryIcons[sub.deliveryMethod] || (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z"/><path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1zM3 15a2 2 0 114 0 2 2 0 01-4 0z"/></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">
                      {sub.connection?.requester?.name || sub.connection?.target?.name || 'Partner'}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {sub.deliveryMethod}
                    </span>
                    {sub.isActive
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Paused</span>
                    }
                  </div>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {sub.feedTypes.map((t) => (
                      <span key={t} className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                        {feedTypeLabels[t] || t}
                      </span>
                    ))}
                  </div>
                  {sub.lastDeliveredAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      Last delivered {new Date(sub.lastDeliveredAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Subscription Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">New Data Feed Subscription</h3>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Partner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner</label>
                {approvedConnections.length === 0 ? (
                  <p className="text-sm text-gray-400">No approved connections. Approve a connection first.</p>
                ) : (
                  <select
                    value={partnerTenantId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Select partner...</option>
                    {approvedConnections.map((c) => (
                      <option key={c.id} value={c.requesterTenantId}>
                        {c.requester?.name || c.requesterTenantId}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Feed Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feed Types</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(feedTypeLabels).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleFeedType(type)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                        feedTypes.includes(type)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                <select value={deliveryMethod} onChange={(e) => setDelivery(e.target.value)} className="input w-full">
                  <option value="WEBHOOK">Webhook (HTTP POST)</option>
                  <option value="API_POLL">API Polling</option>
                  <option value="SFTP">SFTP</option>
                  <option value="AS2">AS2 (EDI)</option>
                </select>
              </div>

              {/* Webhook config */}
              {deliveryMethod === 'WEBHOOK' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                    <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
                      className="input w-full" placeholder="https://your-system.com/webhook" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret (min 20 chars)</label>
                    <input value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)}
                      className="input w-full" placeholder="Your HMAC signing secret" />
                  </div>
                </>
              )}
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowNew(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => subscribeMutation.mutate({
                  partnerTenantId, feedTypes, deliveryMethod,
                  webhookUrl: deliveryMethod === 'WEBHOOK' ? webhookUrl : undefined,
                  webhookSecret: deliveryMethod === 'WEBHOOK' ? webhookSecret : undefined,
                })}
                disabled={!partnerTenantId || feedTypes.length === 0 || subscribeMutation.isPending}
                className="rounded-lg bg-emerald-600 text-white text-sm px-4 py-2 font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Create Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
