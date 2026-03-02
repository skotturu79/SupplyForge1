'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface VendorProfile {
  id: string;
  tenantId: string;
  companyName: string;
  description?: string;
  country: string;
  categories: string[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  website?: string;
  createdAt: string;
}

const CATEGORIES = [
  'Electronics', 'Raw Materials', 'Packaging', 'Chemicals',
  'Textiles', 'Food & Beverage', 'Automotive', 'Medical',
  'Machinery', 'Construction', 'IT & Technology', 'Other',
];

const countryFlag: Record<string, string> = {
  US: '🇺🇸', DE: '🇩🇪', CN: '🇨🇳', GB: '🇬🇧', JP: '🇯🇵',
  FR: '🇫🇷', IN: '🇮🇳', CA: '🇨🇦', AU: '🇦🇺', BR: '🇧🇷',
};

export default function VendorsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery<{ data: VendorProfile[]; meta: { total: number; hasMore: boolean } }>({
    queryKey: ['vendors', debouncedSearch, category, country, page],
    queryFn: () =>
      apiClient.get('/vendors', {
        params: {
          search: debouncedSearch || undefined,
          category: category || undefined,
          country: country || undefined,
          page,
          limit: 12,
        },
      }).then((r) => r.data),
  });

  const connectMutation = useMutation({
    mutationFn: (targetTenantId: string) => apiClient.post('/partners', { targetTenantId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  });

  const vendors = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Directory</h1>
        <p className="text-sm text-gray-500 mt-1">Discover and connect with verified suppliers worldwide</p>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 space-y-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input"
          placeholder="Search vendors by name, description..."
        />
        <div className="flex gap-3 flex-wrap">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="input w-48"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            value={country}
            onChange={(e) => { setCountry(e.target.value.toUpperCase().slice(0, 2)); setPage(1); }}
            className="input w-28"
            placeholder="Country (US)"
            maxLength={2}
          />
          {(search || category || country) && (
            <button
              onClick={() => { setSearch(''); setDebouncedSearch(''); setCategory(''); setCountry(''); setPage(1); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 h-44 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-gray-500">No vendors found matching your search.</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{data?.meta.total ?? 0} vendors found</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => (
              <div key={v.id} className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                {/* Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-100 flex-shrink-0 flex items-center justify-center text-brand-700 font-bold text-sm">
                      {v.companyName[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{v.companyName}</p>
                      <p className="text-xs text-gray-400">
                        {countryFlag[v.country] || '🌍'} {v.country}
                      </p>
                    </div>
                  </div>
                  {v.verificationStatus === 'VERIFIED' ? (
                    <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                  ) : (
                    <span className="flex-shrink-0 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">⏳ Pending</span>
                  )}
                </div>

                {/* Description */}
                {v.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{v.description}</p>
                )}

                {/* Categories */}
                <div className="flex flex-wrap gap-1.5">
                  {v.categories.slice(0, 3).map((cat) => (
                    <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cat}</span>
                  ))}
                  {v.categories.length > 3 && (
                    <span className="text-xs text-gray-400">+{v.categories.length - 3} more</span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  {v.website ? (
                    <a href={v.website} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline truncate max-w-[120px]">
                      {v.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : <span />}
                  <button
                    onClick={() => connectMutation.mutate(v.tenantId)}
                    disabled={connectMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data?.meta && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} · {data.meta.total} total
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="btn-secondary text-xs py-1.5 px-3">
                  ← Prev
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={!data.meta.hasMore} className="btn-secondary text-xs py-1.5 px-3">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
