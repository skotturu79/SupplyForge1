'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────
type CatalogStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK';

interface Product {
  id: string; sku: string; name: string; description: string;
  category: string; unitPrice: number; currency: string; moq: number;
  leadTimeDays: number; stock: number; unit: string; status: CatalogStatus;
  tags: string[]; updatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────
const STATUS_CFG: Record<CatalogStatus, { label: string; cls: string }> = {
  ACTIVE:        { label: 'Active',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INACTIVE:      { label: 'Inactive',      cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  DISCONTINUED:  { label: 'Discontinued',  cls: 'bg-red-50 text-red-600 border-red-200' },
  OUT_OF_STOCK:  { label: 'Out of Stock',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const CATEGORIES = ['All', 'Fasteners', 'Bearings', 'Electronics', 'Mechanical Parts', 'Seals & Gaskets'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY'];
const UNITS      = ['PCS', 'KG', 'M', 'M2', 'L', 'SET', 'BOX'];

function fmt(n: number, cur = 'EUR') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 2 }).format(n);
}

const BLANK: Partial<Product> = {
  sku: '', name: '', description: '', category: '', unitPrice: 0,
  currency: 'EUR', moq: 1, leadTimeDays: 7, stock: 0, unit: 'PCS', status: 'ACTIVE',
};

// ── Component ─────────────────────────────────────────────────────
export default function CatalogPage() {
  const qc = useQueryClient();

  const [tab,       setTab]       = useState<string>('All');
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState<false | 'add' | Product>(false);
  const [form,      setForm]      = useState<Partial<Product>>(BLANK);
  const [delId,     setDelId]     = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-catalog'],
    queryFn: () => apiClient.get('/vendor/catalog').then((r) => r.data),
  });

  const products:   Product[] = data?.data       ?? [];
  const categories: string[]  = ['All', ...(data?.categories ?? [])];

  const filtered = products.filter((p) => {
    const matchCat = tab === 'All' || p.category === tab;
    const matchQ   = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  // ── Mutations ─────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: (payload: Partial<Product> & { id?: string }) =>
      payload.id
        ? apiClient.patch(`/vendor/catalog/${payload.id}`, payload)
        : apiClient.post('/vendor/catalog', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-catalog'] }); setModal(false); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/vendor/catalog/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-catalog'] }); setDelId(null); },
  });

  const openAdd  = () => { setForm(BLANK); setModal('add'); };
  const openEdit = (p: Product) => { setForm({ ...p }); setModal(p); };

  // ── Summary counts ────────────────────────────────────────────
  const active       = products.filter((p) => p.status === 'ACTIVE').length;
  const outOfStock   = products.filter((p) => p.status === 'OUT_OF_STOCK').length;
  const discontinued = products.filter((p) => p.status === 'DISCONTINUED').length;
  const cats         = [...new Set(products.map((p) => p.category))].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#32363A]">Product Catalog</h1>
          <p className="text-sm text-[#6A6D70] mt-1">Manage your SKUs, pricing, lead times and availability</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#107E3E,#0A5C2C)' }}>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          Add Product
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card accent-green p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Active SKUs</p>
          <p className="text-3xl font-bold text-[#107E3E] mt-1">{active}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">{cats} categories</p>
        </div>
        <div className="stat-card accent-amber p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Out of Stock</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{outOfStock}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Needs replenishment</p>
        </div>
        <div className="stat-card accent-red p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Discontinued</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{discontinued}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">No longer sold</p>
        </div>
        <div className="stat-card accent-blue p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Total Products</p>
          <p className="text-3xl font-bold text-[#0070F2] mt-1">{products.length}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">In catalog</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-hero p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EA1A4]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SKU or name…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#EDEDED] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
          </div>
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button key={c} onClick={() => setTab(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === c ? 'bg-[#107E3E] text-white' : 'bg-[#F0F2F4] text-[#6A6D70] hover:bg-[#E8EAF0]'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2 pt-2">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-[#EDEDED] mx-auto mb-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z"/></svg>
            <p className="text-sm text-[#9EA1A4]">No products match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EDEDED]">
                  {['SKU', 'Product', 'Category', 'Unit Price', 'MOQ', 'Stock', 'Lead Time', 'Status', ''].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#9EA1A4]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F6F7]">
                {filtered.map((p) => {
                  const s = STATUS_CFG[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-[#F5F6F7]/70 transition-colors group">
                      <td className="px-3 py-3 font-mono text-xs text-[#6A6D70]">{p.sku}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#32363A] leading-tight">{p.name}</p>
                        <p className="text-xs text-[#9EA1A4] mt-0.5 line-clamp-1">{p.description}</p>
                      </td>
                      <td className="px-3 py-3 text-[#6A6D70]">{p.category}</td>
                      <td className="px-3 py-3 font-semibold text-[#32363A]">{fmt(p.unitPrice, p.currency)}<span className="text-xs text-[#9EA1A4] font-normal ml-1">/{p.unit}</span></td>
                      <td className="px-3 py-3 text-[#6A6D70]">{p.moq.toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : p.stock < p.moq ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {p.stock.toLocaleString()} {p.unit}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[#6A6D70]">{p.leadTimeDays}d</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 rounded text-[#6A6D70] hover:bg-[#E8EAF0] hover:text-[#0070F2] transition-colors"
                            title="Edit">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                          </button>
                          <button onClick={() => setDelId(p.id)}
                            className="p-1.5 rounded text-[#6A6D70] hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-[#EDEDED] flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#354A5E,#2A3D52)' }}>
              <h2 className="text-base font-bold text-white">{modal === 'add' ? 'Add Product' : 'Edit Product'}</h2>
              <button onClick={() => setModal(false)} className="text-white/60 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">SKU *</label>
                  <input value={form.sku ?? ''} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">Category *</label>
                  <input value={form.category ?? ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    list="cat-list" className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                  <datalist id="cat-list">{CATEGORIES.slice(1).map((c) => <option key={c} value={c} />)}</datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">Product Name *</label>
                <input value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">Description</label>
                <textarea value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">Unit Price</label>
                  <input type="number" min="0" step="0.01" value={form.unitPrice ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">Currency</label>
                  <select value={form.currency ?? 'EUR'} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30 bg-white">
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">Unit</label>
                  <select value={form.unit ?? 'PCS'} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30 bg-white">
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">MOQ</label>
                  <input type="number" min="1" value={form.moq ?? 1}
                    onChange={(e) => setForm((f) => ({ ...f, moq: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">Lead Time (days)</label>
                  <input type="number" min="1" value={form.leadTimeDays ?? 7}
                    onChange={(e) => setForm((f) => ({ ...f, leadTimeDays: parseInt(e.target.value) || 7 }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">Stock</label>
                  <input type="number" min="0" value={form.stock ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6A6D70] uppercase tracking-wide mb-1">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_CFG) as CatalogStatus[]).map((s) => (
                    <button key={s} onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.status === s ? 'ring-2 ring-[#0070F2]/50 ' + STATUS_CFG[s].cls : 'bg-[#F0F2F4] text-[#6A6D70] border-[#EDEDED]'}`}>
                      {STATUS_CFG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#EDEDED] flex justify-end gap-3">
              <button onClick={() => setModal(false)}
                className="px-4 py-2 text-sm font-semibold text-[#6A6D70] bg-[#F0F2F4] rounded-lg hover:bg-[#E8EAF0] transition-colors">
                Cancel
              </button>
              <button
                onClick={() => save.mutate(modal === 'add' ? form : { ...form, id: (modal as Product).id })}
                disabled={save.isPending || !form.sku || !form.name}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#107E3E,#0A5C2C)' }}>
                {save.isPending ? 'Saving…' : modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-[#32363A]">Delete product?</h3>
                <p className="text-sm text-[#6A6D70] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDelId(null)} className="px-4 py-2 text-sm font-semibold text-[#6A6D70] bg-[#F0F2F4] rounded-lg hover:bg-[#E8EAF0]">Cancel</button>
              <button onClick={() => remove.mutate(delId)} disabled={remove.isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
