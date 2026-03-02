'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/documents', label: 'Documents', icon: '📋' },
  { href: '/partners', label: 'Partners', icon: '🤝' },
  { href: '/vendors', label: 'Vendors', icon: '🏭' },
  { href: '/tracking', label: 'Tracking', icon: '🚚' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
  { href: '/settings/api-keys', label: 'API Keys', icon: '🔑' },
  { href: '/settings/webhooks', label: 'Webhooks', icon: '⚡' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">SF</div>
          <span className="font-semibold text-gray-900">SupplyForge</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-200">
        <Link href="/settings/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">U</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">My Account</div>
            <div className="text-xs text-gray-500 truncate">Settings</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
