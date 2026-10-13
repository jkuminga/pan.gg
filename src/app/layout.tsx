import type { Metadata } from 'next';
import Link from 'next/link';
import HeaderNav from './header-nav';
import AdminAccess from './admin-access';
import { isAdmin } from '@/lib/admin-auth';
import './globals.css';

export const metadata: Metadata = { title: 'Pan.gg', description: '리그오브레전드 내전 전적 관리' };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const loggedIn = await isAdmin();
  return <html lang="ko"><body>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" href="/" aria-label="Pan.gg 홈"><span className="brand-icon" aria-hidden="true" /><span>Pan<span className="accent">.gg</span></span></Link>
      <HeaderNav />
      <Link className="button header-cta" href="/games/new"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>전적 등록</Link>
    </div></header>
    <main className="container">{children}</main>
    <footer className="site-footer"><div>Pan<span className="accent">.gg</span> <small>© 2026 Scrim Tracker</small><AdminAccess loggedIn={loggedIn} /></div><span><i /> SYSTEM ACTIVE</span></footer>
  </body></html>;
}
