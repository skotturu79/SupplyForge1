'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────
type TeamRole = 'ADMIN' | 'MANAGER' | 'FINANCE' | 'LOGISTICS' | 'VIEWER';

interface TeamMember {
  id: string; email: string; firstName: string; lastName: string;
  role: TeamRole; isActive: boolean; mfaEnabled: boolean;
  lastLoginAt: string | null; invitedAt: string; joinedAt: string | null;
  avatarInitials: string;
}

// ── Helpers ───────────────────────────────────────────────────────
const ROLE_CFG: Record<TeamRole, { label: string; cls: string; desc: string }> = {
  ADMIN:     { label: 'Admin',     cls: 'bg-purple-50 text-purple-700 border-purple-200', desc: 'Full access — manage team, settings, all modules' },
  MANAGER:   { label: 'Manager',   cls: 'bg-blue-50 text-blue-700 border-blue-200',       desc: 'Manage documents, invoices, shipments' },
  FINANCE:   { label: 'Finance',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: 'View & manage invoices, payments, banking' },
  LOGISTICS: { label: 'Logistics', cls: 'bg-amber-50 text-amber-700 border-amber-200',    desc: 'Manage shipments, ASNs, labels' },
  VIEWER:    { label: 'Viewer',    cls: 'bg-gray-100 text-gray-500 border-gray-200',      desc: 'Read-only access to all modules' },
};

const ROLES: TeamRole[] = ['ADMIN', 'MANAGER', 'FINANCE', 'LOGISTICS', 'VIEWER'];

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#354A5E,#2A3D52)',
  'linear-gradient(135deg,#107E3E,#0A5C2C)',
  'linear-gradient(135deg,#6B3FA0,#4A2A72)',
  'linear-gradient(135deg,#0070F2,#004FC3)',
  'linear-gradient(135deg,#E9730C,#B85808)',
];

const BLANK = { email: '', firstName: '', lastName: '', role: 'VIEWER' as TeamRole };

// ── Component ─────────────────────────────────────────────────────
export default function TeamPage() {
  const qc = useQueryClient();
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ ...BLANK });
  const [editId,  setEditId]  = useState<string | null>(null);
  const [editRole,setEditRole]= useState<TeamRole>('VIEWER');
  const [delId,   setDelId]   = useState<string | null>(null);
  const [delName, setDelName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-team'],
    queryFn: () => apiClient.get('/vendor/team').then((r) => r.data),
  });

  const members: TeamMember[] = data?.data ?? [];
  const active   = members.filter((m) => m.isActive).length;
  const pending  = members.filter((m) => !m.joinedAt).length;
  const mfaCount = members.filter((m) => m.mfaEnabled).length;

  const invite = useMutation({
    mutationFn: (payload: typeof form) => apiClient.post('/vendor/team', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-team'] }); setModal(false); },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: TeamRole }) =>
      apiClient.patch(`/vendor/team/${id}`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-team'] }); setEditId(null); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/vendor/team/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-team'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/vendor/team/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-team'] }); setDelId(null); },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#32363A]">Team Management</h1>
          <p className="text-sm text-[#6A6D70] mt-1">Invite colleagues, assign roles and manage portal access</p>
        </div>
        <button onClick={() => { setForm({ ...BLANK }); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#107E3E,#0A5C2C)' }}>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
          Invite Member
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card accent-green p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Active Members</p>
          <p className="text-3xl font-bold text-[#107E3E] mt-1">{active}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Can log in</p>
        </div>
        <div className={`stat-card p-5 ${pending > 0 ? 'accent-amber' : 'accent-green'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Pending Invites</p>
          <p className={`text-3xl font-bold mt-1 ${pending > 0 ? 'text-amber-600' : 'text-[#107E3E]'}`}>{pending}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">Not yet accepted</p>
        </div>
        <div className="stat-card accent-blue p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">MFA Enabled</p>
          <p className="text-3xl font-bold text-[#0070F2] mt-1">{mfaCount} / {members.length}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">2FA protection</p>
        </div>
        <div className="stat-card accent-purple p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6D70]">Total Users</p>
          <p className="text-3xl font-bold text-purple-700 mt-1">{members.length}</p>
          <p className="text-xs text-[#9EA1A4] mt-1">On your account</p>
        </div>
      </div>

      {/* MFA nudge */}
      {mfaCount < members.length && (
        <div className="attn-info">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          <span><strong>{members.length - mfaCount} member{members.length - mfaCount > 1 ? 's' : ''}</strong> without MFA — encourage your team to enable two-factor authentication</span>
        </div>
      )}

      {/* Role legend */}
      <div className="card-hero p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#6A6D70] mb-3">Role Permissions</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ROLES.map((role) => {
            const r = ROLE_CFG[role];
            return (
              <div key={role} className={`rounded-lg border p-2.5 ${r.cls}`}>
                <p className="text-xs font-bold">{r.label}</p>
                <p className="text-[10px] mt-0.5 opacity-75">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Members list */}
      <div className="card-hero">
        <div className="px-5 py-4 border-b border-[#EDEDED] flex items-center justify-between">
          <p className="text-sm font-bold text-[#32363A]">Team Members</p>
          <span className="text-xs text-[#9EA1A4]">{members.length} total</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : members.length === 0 ? (
          <p className="text-center text-sm text-[#9EA1A4] py-10">No team members yet — invite your first colleague</p>
        ) : (
          <div className="divide-y divide-[#F5F6F7]">
            {members.map((m, idx) => {
              const r = ROLE_CFG[m.role];
              const isYou = idx === 0; // first member = current user (mock)
              return (
                <div key={m.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#F5F6F7]/50 transition-colors group">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                    style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                  >
                    {m.avatarInitials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#32363A]">{m.firstName} {m.lastName}</p>
                      {isYou && <span className="px-1.5 py-0.5 bg-[#F0F2F4] rounded text-[10px] font-bold text-[#6A6D70]">YOU</span>}
                      {!m.joinedAt && <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[10px] font-semibold text-amber-700">Invite pending</span>}
                      {!m.isActive && m.joinedAt && <span className="px-1.5 py-0.5 bg-red-50 border border-red-200 rounded text-[10px] font-semibold text-red-600">Suspended</span>}
                      {m.mfaEnabled && <span title="MFA enabled" className="text-emerald-600">🔐</span>}
                    </div>
                    <p className="text-xs text-[#9EA1A4] mt-0.5">{m.email}</p>
                  </div>

                  {/* Role */}
                  <div className="flex-shrink-0">
                    {editId === m.id ? (
                      <div className="flex items-center gap-2">
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value as TeamRole)}
                          className="text-xs border border-[#EDEDED] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30">
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_CFG[r].label}</option>)}
                        </select>
                        <button onClick={() => changeRole.mutate({ id: m.id, role: editRole })}
                          className="px-2 py-1 text-xs font-semibold text-white rounded bg-[#107E3E] hover:bg-[#0A5C2C]">Save</button>
                        <button onClick={() => setEditId(null)} className="px-2 py-1 text-xs text-[#6A6D70]">✕</button>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${r.cls}`}>{r.label}</span>
                    )}
                  </div>

                  {/* Last login */}
                  <div className="hidden sm:block flex-shrink-0 text-right">
                    <p className="text-[10px] text-[#9EA1A4]">Last login</p>
                    <p className="text-xs text-[#6A6D70] font-medium">{fmtDate(m.lastLoginAt)}</p>
                  </div>

                  {/* Actions */}
                  {!isYou && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => { setEditId(m.id); setEditRole(m.role); }}
                        title="Change role"
                        className="p-1.5 rounded text-[#6A6D70] hover:bg-[#E8EAF0] hover:text-[#0070F2] transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                      </button>
                      <button
                        onClick={() => toggleActive.mutate({ id: m.id, isActive: !m.isActive })}
                        title={m.isActive ? 'Suspend' : 'Reactivate'}
                        className={`p-1.5 rounded transition-colors ${m.isActive ? 'text-[#6A6D70] hover:bg-amber-50 hover:text-amber-600' : 'text-[#6A6D70] hover:bg-emerald-50 hover:text-emerald-600'}`}>
                        {m.isActive ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </button>
                      <button onClick={() => { setDelId(m.id); setDelName(`${m.firstName} ${m.lastName}`); }}
                        title="Remove"
                        className="p-1.5 rounded text-[#6A6D70] hover:bg-red-50 hover:text-red-600 transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-[#EDEDED] flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#354A5E,#2A3D52)' }}>
              <h2 className="text-base font-bold text-white">Invite Team Member</h2>
              <button onClick={() => setModal(false)} className="text-white/60 hover:text-white">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">First Name *</label>
                  <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Last Name *</label>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-1">Email Address *</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 text-sm border border-[#EDEDED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6A6D70] mb-2">Role *</label>
                <div className="space-y-2">
                  {ROLES.map((role) => {
                    const r = ROLE_CFG[role];
                    return (
                      <label key={role} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.role === role ? 'border-[#0070F2] bg-blue-50' : 'border-[#EDEDED] hover:border-[#C8CAD0]'}`}>
                        <input type="radio" name="role" value={role} checked={form.role === role}
                          onChange={() => setForm((f) => ({ ...f, role }))} className="mt-0.5" />
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${r.cls}`}>{r.label}</span>
                          <p className="text-xs text-[#9EA1A4] mt-0.5">{r.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#EDEDED] flex justify-end gap-3">
              <button onClick={() => setModal(false)}
                className="px-4 py-2 text-sm font-semibold text-[#6A6D70] bg-[#F0F2F4] rounded-lg hover:bg-[#E8EAF0]">Cancel</button>
              <button
                onClick={() => invite.mutate(form)}
                disabled={invite.isPending || !form.email || !form.firstName}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#107E3E,#0A5C2C)' }}>
                {invite.isPending ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <p className="font-bold text-[#32363A]">Remove {delName}?</p>
            <p className="text-sm text-[#6A6D70]">Their access will be revoked immediately.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDelId(null)} className="px-4 py-2 text-sm font-semibold text-[#6A6D70] bg-[#F0F2F4] rounded-lg">Cancel</button>
              <button onClick={() => remove.mutate(delId!)} disabled={remove.isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {remove.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
