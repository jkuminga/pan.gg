import Link from 'next/link';
import type { Game, Team } from '@/lib/games';
import { gameDate, won } from '@/lib/format';

export default function GameCard({ game, compact = false }: { game: Game; compact?: boolean }) {
  return <article className={`match-card ${compact ? 'compact' : ''} ${game.winning_team.toLowerCase()}-winner`}>
    <div className="match-card-top">
      <div><Link href={`/games/${game.id}`} className="match-id">#{game.id}</Link><span className="match-date">◷ {gameDate(game.played_at)}</span></div>
      <div className="match-top-right"><span className="stake-chip">1인당 판돈 {won(game.stake)}</span><span className={`winner-chip ${game.winning_team.toLowerCase()}`}>{game.winning_team} WIN</span></div>
    </div>
    <div className="match-teams">
      {(['BLUE', 'RED'] as Team[]).map((team, index) => <div className="match-team-wrap" key={team}>
        {index === 1 && <span className="match-vs">VS</span>}
        <div className="match-team"><div className={`team-caption ${team.toLowerCase()}`}><strong>● {team} TEAM</strong><span>{game.winning_team === team ? '승리' : '패배'} · {game.participants.filter(p => p.team === team).length}명</span></div>
          <div className="roster-line">{game.participants.filter(p => p.team === team).map(p => <span key={p.player_id}><small>{String(p.slot).padStart(2, '0')}</small>{p.name}</span>)}</div>
        </div>
      </div>)}
    </div>
    <div className="match-card-bottom"><span>기록 완료 · {game.participants.length}명 참가</span><Link href={`/games/${game.id}`}>상세 정보 보기 ↗</Link></div>
  </article>;
}
