import Link from 'next/link';
import GameCard from '@/app/game-card';
import { getGames, getGameSummary } from '@/lib/games';
import { won } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [summary, games] = await Promise.all([getGameSummary(), getGames({ limit: 3 })]);
  const bluePercent = summary.games ? Math.round(summary.blue_wins / summary.games * 100) : 0;
  return <>
    <div className="page-heading"><div><p className="eyebrow">● TELEMETRY DECK / SCRIM TRACKER</p><h1>내전 종합 대시보드</h1><p>경기 결과와 플레이어 기록을 한곳에서 확인하세요.</p></div><Link className="button" href="/games/new">⊕ 새 전적 등록</Link></div>
    <div className="metric-grid">
      <div className="metric-card"><span>총 진행 경기</span><strong>{summary.games}<small>회</small></strong><em>저장된 경기 기록</em></div>
      <div className="metric-card gold"><span>누적 판돈 총액</span><strong>{won(summary.total_stake)}</strong><em>참가자별 판돈 합계</em></div>
      <div className="metric-card"><span>등록된 플레이어</span><strong>{summary.players}<small>명</small></strong><em>현재 등록 인원</em></div>
      <div className="metric-card"><span>승리 진영 비율</span><div className="winbar-label"><b>BLUE {summary.blue_wins}승</b><b>RED {summary.red_wins}승</b></div><div className="winbar"><span style={{ width: `${bluePercent}%` }} /></div><em>블루 {bluePercent}% · 레드 {summary.games ? 100 - bluePercent : 0}%</em></div>
    </div>
    <div className="quick-grid"><Link href="/games/new"><span className="quick-icon">⊕</span><span><strong>전적 등록</strong><small>새로운 경기 결과 기록</small></span><b>↗</b></Link><Link href="/players/new"><span className="quick-icon violet">♙</span><span><strong>플레이어 관리</strong><small>플레이어 등록과 전적 확인</small></span><b>↗</b></Link><Link href="/games"><span className="quick-icon amber">☷</span><span><strong>전체 경기 보기</strong><small>모든 경기의 상세 기록</small></span><b>↗</b></Link></div>
    <div className="section-heading"><div><p className="eyebrow">MATCH FEED</p><h2>최근 경기 전적</h2></div><Link href="/games">전체 보기 →</Link></div>
    {games.length ? <div className="match-list">{games.map(game => <GameCard game={game} compact key={game.id} />)}</div> : <div className="empty-state"><strong>아직 기록된 경기가 없습니다</strong><p>첫 경기를 등록하면 이곳에 표시됩니다.</p><Link href="/games/new">전적 등록하기 →</Link></div>}
  </>;
}
