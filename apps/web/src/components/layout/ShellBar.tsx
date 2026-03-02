'use client';

import Link from 'next/link';

interface ShellBarProps {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  backHref?: string;
  backLabel?: string;
  rightContent?: React.ReactNode;
}

export function ShellBar({ title, subtitle, onMenuToggle, backHref, backLabel, rightContent }: ShellBarProps) {
  return (
    <header
      className="h-11 flex items-center px-2 gap-1 fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(135deg, #2C3E50 0%, #354A5E 60%, #2A3D52 100%)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
      }}
      role="banner"
    >
      {/* Hamburger */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all flex-shrink-0"
        aria-label="Toggle side navigation"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
          <path fillRule="evenodd" d="M3 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Back breadcrumb (optional) */}
      {backHref && (
        <>
          <Link href={backHref} className="px-1.5 py-0.5 rounded text-white/50 hover:text-white/80 text-xs transition-colors">
            {backLabel ?? 'Back'}
          </Link>
          <span className="text-white/25 text-xs select-none">/</span>
        </>
      )}

      {/* Logo + product name */}
      <Link href="/" className="flex items-center gap-2.5 px-1 hover:opacity-90 transition-opacity flex-shrink-0 ml-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-extrabold text-[11px] select-none tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #0070F2 0%, #004FC3 100%)',
            boxShadow: '0 2px 8px rgba(0,112,242,0.45)',
          }}
        >
          SF
        </div>
        <span className="text-white font-semibold text-sm leading-none tracking-tight">{title}</span>
        {subtitle && (
          <>
            <span className="text-white/25 text-xs select-none">|</span>
            <span className="text-white/65 text-xs leading-none font-medium">{subtitle}</span>
          </>
        )}
      </Link>

      <div className="flex-1" />

      {/* Right-side action strip */}
      <div className="flex items-center gap-0.5">
        {/* Injected content (notification bell, etc.) */}
        {rightContent}

        {/* Search */}
        <button
          className="p-2 rounded-lg text-white/55 hover:bg-white/10 hover:text-white transition-all"
          aria-label="Search"
          title="Global search"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-[17px] h-[17px]">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Settings */}
        <button
          className="p-2 rounded-lg text-white/55 hover:bg-white/10 hover:text-white transition-all"
          aria-label="Settings"
          title="Settings"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-[17px] h-[17px]">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Help */}
        <button
          className="p-2 rounded-lg text-white/55 hover:bg-white/10 hover:text-white transition-all"
          aria-label="Help"
          title="Help & documentation"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-[17px] h-[17px]">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/15 mx-1" />

        {/* User avatar */}
        <button
          className="w-7 h-7 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-[11px] font-bold hover:border-white/50 transition-all"
          style={{ background: 'linear-gradient(135deg, #107E3E 0%, #0D6832 100%)' }}
          aria-label="User menu"
          title="Acme Manufacturing"
        >
          AC
        </button>
      </div>
    </header>
  );
}
