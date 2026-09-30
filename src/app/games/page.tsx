import Link from 'next/link';
import GameCard from '@/app/game-card';
import { getGames, type Team } from '@/lib/games';

export const dynamic = 'force-dynamic';

export default async function Games({ searchParams }: { searchParams: Promise<{ q?: string; winner?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? '';
  const winner = params.winner === 'BLUE' || params.winner === 'RED' ? params.winner as Team : undefined;
  const games = await getGames({ query, winner });
  return <>
    <div className="page-heading"><div><p className="eyebrow">● MATCH ARCHIVES / GAME LOG</p><h1>경기 전적 목록</h1><p>기록된 경기의 승패와 참가 플레이어를 확인하세요.</p></div><Link className="button" href="/games/new">⊕ 새 전적 등록</Link></div>
    <form className="filter-bar" action="/games" method="get"><input name="q" aria-label="경기 번호 또는 플레이어 검색" placeholder="플레이어 이름, 닉네임 또는 경기 번호 검색" defaultValue={query} /><select name="winner" aria-label="승리 팀" defaultValue={winner ?? ''}><option value="">전체 승리 팀</option><option value="BLUE">블루 승</option><option value="RED">레드 승</option></select><button type="submit">검색</button><Link href="/games">초기화</Link></form>
    <div className="list-count">SHOWING: <strong>{games.length} MATCHES FOUND</strong></div>
    {games.length ? <div className="match-list">{games.map(game => <GameCard game={game} key={game.id} />)}</div> : <div className="empty-state"><strong>{query || winner ? '검색 결과가 없습니다' : '등록된 경기 전적이 없습니다'}</strong><p>검색 조건을 바꾸거나 새 경기를 등록해 보세요.</p><Link href="/games/new">전적 등록하기 →</Link></div>}
  </>;
}
