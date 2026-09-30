import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = { title: '내전LOG', description: '리그오브레전드 내전 전적 관리' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" href="/"><span className="brand-icon">⌑</span><span>내전<span className="accent">LOG</span><small>SCRIM TRACKER</small></span></Link>
      <span className="header-kicker"><i /> 리그오브레전드 내전 전적 관리</span>
      <nav aria-label="주 메뉴"><Link href="/">홈</Link><Link href="/games">게임 목록</Link><Link href="/games/new">게임 전적 등록</Link><Link href="/players/new">플레이어 관리</Link></nav>
      <Link className="button header-cta" href="/games/new">⊕ 전적 등록</Link>
    </div></header>
    <main className="container">{children}</main>
    <footer className="site-footer"><span>내전<span className="accent">LOG</span> <small>© 2026 Scrim Tracker</small></span><span><i /> SYSTEM ACTIVE</span></footer>
  </body></html>;
}
