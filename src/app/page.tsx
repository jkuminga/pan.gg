import Link from 'next/link';
import GameCard from '@/app/game-card';
import { getGames, getGameSummary } from '@/lib/games';
import { won } from '@/lib/format';
import './home.css';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [games, summary] = await Promise.all([getGames({ limit: 3 }), getGameSummary()]);
  return <>
    <section className="home-hero" aria-label="Pan.gg">
      <div className="home-hero-logo" role="img" aria-label="Pan.gg 로고">
        <svg className="home-hero-mark" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="home-mark-cyan" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#28F1E2" /><stop offset="1" stopColor="#12BFC4" /></linearGradient>
            <linearGradient id="home-mark-blue" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#67B8FF" /><stop offset="1" stopColor="#2F7FEF" /></linearGradient>
          </defs>
          <path d="M10 8h35l10 10v11L44 40H26V28h16l3-3v-4H24Z" fill="url(#home-mark-cyan)" />
          <path d="M10 16v24l14-12Z" fill="url(#home-mark-blue)" />
          <path d="M10 49 24 36v13L10 61Z" fill="url(#home-mark-cyan)" />
        </svg>
        <span className="home-hero-wordmark">Pan<span>.gg</span></span>
      </div>
      <p className="home-hero-tagline">We&apos;ve wasted {won(summary.total_stake)} and made absolutely no progress in life.</p>
    </section>
    <div className="section-heading"><div><p className="eyebrow">● MATCH HISTORY</p><h2>최근 경기 전적</h2></div><Link href="/games">전체 보기 →</Link></div>
    {games.length ? <div className="match-list">{games.map(game => <GameCard game={game} key={game.id} />)}</div> : <div className="empty-state"><strong>아직 기록된 경기가 없습니다</strong><p>첫 경기를 등록하면 이곳에 표시됩니다.</p><Link href="/games/new">전적 등록하기 →</Link></div>}
  </>;
}
