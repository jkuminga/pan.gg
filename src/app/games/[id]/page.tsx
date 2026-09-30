import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGame, type Team } from '@/lib/games';
import { gameDate, won } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function GameDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const game = await getGame(id);
  if (!game) notFound();
  const date = gameDate(game.played_at);
  const teamSize = game.participants.length / 2;
  return <>
    <div className="detail-nav"><Link href="/games">← 게임 목록으로 돌아가기</Link><span>VERIFIED MATCH #{game.id}</span></div>
    <div className="detail-hero"><div><p className="eyebrow">OFFICIAL SCRIM RECORD</p><h1>경기 #{game.id} 상세 전적</h1><p>{date} · {game.participants.length}명 참가 ({teamSize} 대 {teamSize})</p></div><div className={`hero-verdict ${game.winning_team.toLowerCase()}`}><small>MATCH WINNER</small><strong>{game.winning_team} TEAM 승리</strong></div></div>
    <div className="detail-metrics"><div><span>1인당 판돈</span><strong className="gold-text">{won(game.stake)}</strong><small>참가자 1명 기준</small></div><div><span>전체 참가 판돈</span><strong>{won(game.stake * game.participants.length)}</strong><small>{game.participants.length}명 판돈 합계</small></div><div><span>개인별 손익</span><strong><span className="gain">+{won(game.stake)}</span> / <span className="loss-text">-{won(game.stake)}</span></strong><small>승리 / 패배</small></div></div>
    <div className="detail-grid">{(['BLUE', 'RED'] as Team[]).map((team) => <section className="detail-team" key={team}>
      <div className="detail-team-title"><h2 className={team.toLowerCase()}>{team} TEAM <small>{game.participants.filter(p => p.team === team).length}명</small></h2><span className={game.winning_team === team ? 'winner-chip blue' : 'winner-chip red'}>{game.winning_team === team ? 'VICTORY' : 'DEFEAT'}</span></div>
      <div className="detail-team-list">{game.participants.filter((p) => p.team === team).map((p) => <div key={p.player_id}><span className="slot-code">SLOT {String(p.slot).padStart(2, '0')}</span><span><strong>{p.nickname || p.name}</strong><small>{p.nickname ? p.name : '플레이어'}</small></span><b className={game.winning_team === team ? 'gain' : 'loss-text'}>{game.winning_team === team ? '+' : '-'}{won(game.stake)}</b></div>)}</div>
      <div className="team-total"><span>{team} TEAM 손익 합계</span><strong className={game.winning_team === team ? 'gain' : 'loss-text'}>{game.winning_team === team ? '+' : '-'}{won(game.stake * teamSize)}</strong></div>
    </section>)}</div>
  </>;
}
