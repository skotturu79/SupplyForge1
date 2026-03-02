'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellBar } from '@/components/layout/ShellBar';
import { SideNav, NavGroup } from '@/components/layout/SideNav';
import { apiClient } from '@/lib/api-client';
import { getStoredUser, getStoredToken, portalPath, type MockUser } from '@/lib/mock-auth';

// ── Icon helpers (kept inline to avoid extra files) ──────────
const Icon = {
  dashboard:   <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>,
  connections: <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>,
  documents:   <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
  invoices:    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>,
  shipments:   <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1H5V5a1 1 0 00-1-1H3zM14 7a1 1 0 011 1v1h2.05A2.5 2.5 0 0119 11.5V14a1 1 0 01-1 1h-1.05a2.5 2.5 0 01-4.9 0H11V8a1 1 0 011-1h2z" /></svg>,
  labels:      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293l-7-7A1 1 0 0010 2H4a2 2 0 00-2 2v6a1 1 0 00.293.707l7 7a1 1 0 001.414 0l6-6a1 1 0 000-1.414zM5.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clipRule="evenodd" /></svg>,
  catalog:     <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>,
  returns:     <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>,
  payments:    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" /></svg>,
  quotes:      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" /></svg>,
  analytics:   <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>,
  feed:        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z" /><path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1zM3 15a2 2 0 114 0 2 2 0 01-4 0z" /></svg>,
  profile:     <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>,
  vault:       <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>,
  team:        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" /></svg>,
};

// ── Notification Bell ────────────────────────────────────────
const TYPE_ICON: Record<string, string> = {
  DOCUMENT: '📄', PAYMENT: '💳', SHIPMENT: '🚚', PARTNER: '🤝', ALERT: '⚠️',
};

function NotificationBell() {
  const [open, setOpen]   = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Array<{
    id: string; type: string; title: string; message: string; link: string; read: boolean; createdAt: string;
  }>>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.get('/notifications').then((r) => {
      setUnread(r.data.unread ?? 0);
      setItems(r.data.data ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    await apiClient.patch('/notifications', { markAllRead: true }).catch(() => {});
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-lg text-white/55 hover:bg-white/10 hover:text-white transition-all relative"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-[17px] h-[17px]">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-2.83-2h5.66A3 3 0 0110 18z" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-2xl border border-[#EDEDED] z-50 overflow-hidden animate-slide-down">
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,#354A5E,#2A3D52)' }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 rounded-full text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-white/70 hover:text-white transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-[#F5F6F7]">
            {items.length === 0 ? (
              <p className="text-xs text-center text-[#6A6D70] py-8">All caught up!</p>
            ) : (
              items.map((n) => (
                <Link key={n.id} href={n.link} onClick={() => setOpen(false)}
                  className={`flex gap-3 px-4 py-3 hover:bg-[#F5F6F7] transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
                  <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-[#32363A] truncate">{n.title}</p>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-[#6A6D70] mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-[#9EA1A4] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="px-4 py-2.5 bg-[#F5F6F7] border-t border-[#EDEDED] flex items-center justify-between">
            <Link href="/vendor/dashboard" onClick={() => setOpen(false)}
              className="text-xs text-[#0070F2] hover:underline font-medium">
              View all activity
            </Link>
            <span className="text-[10px] text-[#9EA1A4]">Live updates</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar user profile card ────────────────────────────────
function SidebarUserCard({ score, user }: { score: number; user: MockUser | null }) {
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '??';
  const companyName = user?.tenantName ?? 'Vendor Portal';

  return (
    <div className="space-y-2.5">
      {/* Company info */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#354A5E,#1B4332)' }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#32363A] truncate leading-tight">{companyName}</p>
          <span className="tier-trusted text-[10px] leading-none">★ Trusted Supplier</span>
        </div>
      </div>

      {/* Supplier score bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-[#6A6D70] font-medium">Supplier Score</span>
          <span className="text-[10px] font-bold text-[#107E3E]">{score} / 100</span>
        </div>
        <div className="h-1.5 bg-[#EDEDED] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${score}%`, background: 'linear-gradient(90deg,#107E3E,#34D399)' }}
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5">
        <span className="live-dot-green" />
        <span className="text-[10px] text-[#6A6D70]">Connected · 2 partners online</span>
      </div>

      {/* Footer links */}
      <div className="flex gap-3 pt-0.5">
        <Link href="/vendor/profile" className="text-[10px] text-[#0070F2] hover:underline">My Profile</Link>
        <Link href="/vendor/analytics" className="text-[10px] text-[#0070F2] hover:underline">Scorecard</Link>
      </div>
    </div>
  );
}

// ── Root layout ───────────────────────────────────────────────
export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser]                       = useState<MockUser | null>(null);
  const [collapsed, setCollapsed]             = useState(false);
  const [pendingDocs, setPendingDocs]         = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const [score, setScore]                     = useState(90);

  // Auth guard — redirect if not logged in or wrong tenant type
  useEffect(() => {
    const storedUser  = getStoredUser();
    const token       = getStoredToken();
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }
    if (storedUser.tenantType !== 'VENDOR') {
      router.push(portalPath(storedUser));
      return;
    }
    setUser(storedUser);
  }, [router]);

  // Fetch live badge counts once on mount
  useEffect(() => {
    apiClient.get('/documents', { params: { status: 'SENT', limit: 1 } })
      .then((r) => setPendingDocs(r.data?.meta?.total ?? 0))
      .catch(() => {});
    apiClient.get('/analytics/kpis')
      .then((r) => {
        setPendingInvoices(r.data?.pendingInvoices ?? 0);
      })
      .catch(() => {});
  }, []);

  const navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { href: '/vendor/dashboard',   label: 'Dashboard',   icon: Icon.dashboard   },
        { href: '/vendor/connections', label: 'Connections', icon: Icon.connections },
      ],
    },
    {
      label: 'Commerce',
      items: [
        { href: '/vendor/quotes',    label: 'Quotes',    icon: Icon.quotes,    badge: pendingDocs > 0 ? pendingDocs : 0 },
        { href: '/vendor/catalog',   label: 'Catalog',   icon: Icon.catalog   },
        { href: '/vendor/returns',   label: 'Returns',   icon: Icon.returns   },
      ],
    },
    {
      label: 'Supply Chain',
      items: [
        { href: '/vendor/documents', label: 'Documents', icon: Icon.documents, badge: pendingDocs        },
        { href: '/vendor/invoices',  label: 'Invoices',  icon: Icon.invoices,  badge: pendingInvoices   },
        { href: '/vendor/payments',  label: 'Payments',  icon: Icon.payments  },
        { href: '/vendor/shipments', label: 'Shipments', icon: Icon.shipments  },
        { href: '/vendor/labels',    label: 'Labels',    icon: Icon.labels     },
      ],
    },
    {
      label: 'Insights',
      items: [
        { href: '/vendor/analytics', label: 'Analytics', icon: Icon.analytics },
        { href: '/vendor/feed',      label: 'Data Feed', icon: Icon.feed      },
      ],
    },
    {
      label: 'Account',
      items: [
        { href: '/vendor/profile', label: 'Profile',  icon: Icon.profile },
        { href: '/vendor/vault',   label: 'Doc Vault', icon: Icon.vault   },
        { href: '/vendor/team',    label: 'Team',      icon: Icon.team    },
      ],
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F0F2F4' }}>
      <ShellBar
        title="SupplyForge"
        subtitle="Vendor Portal"
        onMenuToggle={() => setCollapsed((c) => !c)}
        rightContent={<NotificationBell />}
      />

      <div className="flex pt-11">
        <SideNav
          groups={navGroups}
          collapsed={collapsed}
          footerContent={<SidebarUserCard score={score} user={user} />}
        />

        <main className="flex-1 overflow-auto min-w-0">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
