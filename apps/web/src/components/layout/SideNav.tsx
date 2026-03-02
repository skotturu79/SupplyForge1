'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

export interface NavItem {
  href: string;
  label: string;
  /** 20×20 SVG element or any React node to use as the nav icon */
  icon: React.ReactNode;
  /** Optional count badge shown on the nav item */
  badge?: number;
}

export interface NavGroup {
  /** Section label shown above the group (hidden in collapsed mode) */
  label: string;
  items: NavItem[];
}

interface SideNavProps {
  /** Flat list (legacy / backward compat) */
  items?: NavItem[];
  /** Grouped nav — preferred over items when provided */
  groups?: NavGroup[];
  /** When true, only icons are shown (48px wide); labels visible when false (224px wide) */
  collapsed: boolean;
  /** Optional content rendered at the bottom of the nav (hidden when collapsed) */
  footerContent?: React.ReactNode;
}

export function SideNav({ items, groups, collapsed, footerContent }: SideNavProps) {
  const pathname = usePathname();

  // Normalise to groups format for unified rendering
  const navGroups: NavGroup[] = groups ?? (items ? [{ label: '', items }] : []);

  const renderItem = (item: NavItem) => {
    const active = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={clsx(
          'group relative flex items-center gap-3 py-2.5 text-sm font-medium transition-all duration-150',
          'pl-[9px] pr-3',
          active
            ? 'border-l-[3px] border-[#107E3E] text-[#107E3E]'
            : 'border-l-[3px] border-transparent text-[#4A4D52] hover:bg-[#F5F6F7] hover:text-[#32363A]',
        )}
        style={active ? { background: 'linear-gradient(90deg, rgba(16,126,62,0.08) 0%, rgba(16,126,62,0.02) 100%)' } : undefined}
      >
        {/* Icon */}
        <span className={clsx(
          'flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors',
          active ? 'text-[#107E3E]' : 'text-[#8C8F94] group-hover:text-[#354A5E]',
        )}>
          {item.icon}
        </span>

        {/* Label */}
        {!collapsed && (
          <span className="flex-1 truncate leading-none">{item.label}</span>
        )}

        {/* Badge (expanded mode) */}
        {!collapsed && item.badge && item.badge > 0 ? (
          <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
        ) : null}

        {/* Badge (collapsed mode — small dot overlay) */}
        {collapsed && item.badge && item.badge > 0 ? (
          <span className="absolute top-1.5 right-1 w-[18px] h-[18px] bg-[#E9730C] rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        ) : null}

        {/* Tooltip (collapsed mode) */}
        {collapsed && (
          <span className={clsx(
            'pointer-events-none absolute left-[3.25rem] top-1/2 -translate-y-1/2 z-[60]',
            'whitespace-nowrap rounded-lg bg-[#2C3E50] px-2.5 py-1.5 text-xs text-white shadow-xl',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            'flex items-center gap-2',
          )}>
            {item.label}
            {item.badge && item.badge > 0 ? (
              <span className="px-1.5 py-0.5 bg-[#E9730C] rounded-full text-[9px] font-bold">
                {item.badge}
              </span>
            ) : null}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={clsx(
        'flex-shrink-0 flex flex-col',
        'h-[calc(100vh-44px)] sticky top-11 transition-[width] duration-200 overflow-hidden',
        collapsed ? 'w-12' : 'w-[220px]',
      )}
      style={{ background: '#FFFFFF', borderRight: '1px solid #EDEDED' }}
    >
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden" role="navigation">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
            {/* Section label */}
            {group.label && !collapsed && (
              <div className="px-3 pt-3 pb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9EA1A4]">
                  {group.label}
                </p>
              </div>
            )}
            {/* Collapsed: thin separator between groups */}
            {group.label && gi > 0 && collapsed && (
              <div className="mx-2 my-1.5 h-px bg-[#EDEDED]" />
            )}
            {group.items.map(renderItem)}
          </div>
        ))}
      </nav>

      {/* Footer slot */}
      {footerContent && !collapsed && (
        <div className="border-t border-[#EDEDED] p-3 text-xs text-[#6A6D70]">
          {footerContent}
        </div>
      )}
    </aside>
  );
}
