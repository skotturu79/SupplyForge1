'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

type TabId = 'profile' | 'team' | 'notifications' | 'security';

interface TenantProfile {
  id: string;
  companyName: string;
  website?: string;
  country: string;
  vatId?: string;
  description?: string;
  notificationSettings?: Record<string, boolean>;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Session {
  id: string;
  device: string;
  ip: string;
  lastUsedAt: string;
  current: boolean;
}

const NOTIFICATIONS = [
  { key: 'documentReceived',     label: 'Document Received',      desc: 'When a partner sends you a PO, invoice, or ASN' },
  { key: 'documentStatusChanged', label: 'Document Status Changed', desc: 'When your sent documents are acknowledged or accepted' },
  { key: 'connectionRequest',    label: 'Connection Request',      desc: 'When a new business requests to connect with you' },
  { key: 'shipmentUpdate',       label: 'Shipment Update',         desc: 'Tracking events for your active shipments' },
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>('profile');

  // Profile form
  const [form, setForm] = useState({ companyName: '', website: '', country: '', vatId: '', description: '' });
  const [profileSaved, setProfileSaved] = useState(false);

  // Team invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  const { data: profile } = useQuery<TenantProfile>({
    queryKey: ['tenant-me'],
    queryFn: () => apiClient.get('/tenants/me').then((r) => ({
      ...r.data,
      companyName: r.data.name ?? r.data.companyName ?? '',
    })),
  });

  const { data: members = [] } = useQuery<TeamMember[]>({
    queryKey: ['team-members'],
    queryFn: () => apiClient.get('/users').then((r) => r.data?.data ?? r.data),
    enabled: tab === 'team',
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['auth-sessions'],
    queryFn: () => apiClient.get('/auth/sessions').then((r) =>
      (r.data?.data ?? r.data).map((s: Record<string, unknown>) => ({
        ...s,
        device:     s.userAgent ?? s.device ?? 'Unknown',
        lastUsedAt: s.createdAt,
      }))
    ),
    enabled: tab === 'security',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName || '',
        website: profile.website || '',
        country: profile.country || '',
        vatId: profile.vatId || '',
        description: profile.description || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof form) => apiClient.patch('/tenants/me', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant-me'] }); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); },
  });

  const updateNotifMutation = useMutation({
    mutationFn: (settings: Record<string, boolean>) => apiClient.patch('/tenants/me', { notificationSettings: settings }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-me'] }),
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) => apiClient.post('/users/invite', { email, role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-members'] }); setShowInvite(false); setInviteEmail(''); },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/auth/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth-sessions'] }),
  });

  const toggleNotif = (key: string) => {
    const current = profile?.notificationSettings ?? {};
    updateNotifMutation.mutate({ ...current, [key]: !(current[key] ?? true) });
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile',       label: 'Profile' },
    { id: 'team',          label: 'Team' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security',      label: 'Security' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card p-6 max-w-2xl space-y-4">
          <h2 className="font-semibold text-gray-900">Company Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country (ISO 3166)</label>
              <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase().slice(0, 2) }))} className="input" placeholder="US" maxLength={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="input" placeholder="https://" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VAT ID (optional)</label>
            <input value={form.vatId} onChange={(e) => setForm((f) => ({ ...f, vatId: e.target.value }))} className="input" placeholder="EU123456789" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input h-24 resize-none" placeholder="Brief description of your company..." />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={() => updateProfileMutation.mutate(form)} disabled={updateProfileMutation.isPending} className="btn-primary">
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            {profileSaved && <span className="text-sm text-green-600">✓ Saved</span>}
          </div>
        </div>
      )}

      {/* Team Tab */}
      {tab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Team Members</h2>
            <button onClick={() => setShowInvite(true)} className="btn-primary text-sm">Invite Member</button>
          </div>
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Joined'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">No team members yet</td></tr>
                ) : members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{m.firstName} {m.lastName}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{m.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{m.role}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${m.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showInvite && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Invite Team Member</h3>
                  <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" className="input" placeholder="colleague@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="input">
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </div>
                </div>
                <div className="px-6 pb-5 flex gap-3 justify-end">
                  <button onClick={() => setShowInvite(false)} className="btn-secondary">Cancel</button>
                  <button onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })} disabled={!inviteEmail || inviteMutation.isPending} className="btn-primary">
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="card p-6 max-w-2xl space-y-5">
          <h2 className="font-semibold text-gray-900">Email Notifications</h2>
          {NOTIFICATIONS.map((n) => {
            const enabled = profile?.notificationSettings?.[n.key] ?? true;
            return (
              <div key={n.key} className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotif(n.key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${enabled ? 'bg-brand-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="space-y-4 max-w-2xl">
          <div className="card p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Password & MFA</h2>
            <p className="text-sm text-gray-500">Keep your account secure with a strong password and two-factor authentication.</p>
            <div className="flex gap-3">
              <a href="/auth/change-password" className="btn-secondary text-sm">Change Password</a>
              <a href="/settings/mfa" className="btn-secondary text-sm">Configure MFA</a>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Active Sessions</h2>
            </div>
            {sessions.length === 0 ? (
              <div className="p-5 text-sm text-gray-400">No active sessions found.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sessions.map((s) => (
                  <div key={s.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.device}{s.current && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Current</span>}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.ip} · Last used {new Date(s.lastUsedAt).toLocaleString()}</p>
                    </div>
                    {!s.current && (
                      <button onClick={() => revokeSessionMutation.mutate(s.id)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded px-2 py-1 transition-colors">
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
