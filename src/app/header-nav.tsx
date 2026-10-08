'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: '홈', icon: 'home' },
  { href: '/games', label: '게임 목록', icon: 'list' },
  { href: '/statistics', label: '통계', icon: 'stats' },
  { href: '/players/new', label: '플레이어 관리', icon: 'users' },
  { href: '/ladder', label: '사다리 타기', icon: 'ladder' },
] as const;

function NavIcon({ name }: { name: (typeof links)[number]['icon'] }) {
  const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (name === 'home') return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>;
  if (name === 'list') return <svg {...common}><path d="M5 6h14M5 12h14M5 18h14" /></svg>;
  if (name === 'stats') return <svg {...common}><path d="M4 20V12M10 20V5M16 20v-8M22 20V9M3 20h19" /></svg>;
  if (name === 'users') return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2H3zM17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1h-3" /></svg>;
  return <svg {...common}><path d="M6 4v16M18 4v16M6 8h12M6 15h12" /></svg>;
}

export default function HeaderNav() {
  const pathname = usePathname();

  return <nav className="header-nav" aria-label="주 메뉴">
    {links.map(({ href, label, icon }) => {
      const active = href === '/' ? pathname === '/' : href === '/games' ? pathname === '/games' || pathname.startsWith('/games/') && !pathname.startsWith('/games/new') : pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}><NavIcon name={icon} /><span>{label}</span></Link>;
    })}
  </nav>;
}
