import Link from 'next/link';
import type { Game, Team } from '@/lib/games';
import { gameDate, won } from '@/lib/format';
import DeleteGameButton from './delete-game-button';
import './game-card.css';

export default function GameCard({ game, canDelete = false }: { game: Game; canDelete?: boolean }) {
  return <article className={`match-card compact ${game.winning_team.toLowerCase()}-winner`}>
    <div className="match-card-top">
      <div className="match-summary"><Link href={`/games/${game.id}`} className="match-id">#{game.id}</Link><span className="stake-chip"> <strong>{won(game.stake)}</strong></span></div>
      <div className="match-card-actions"><Link className="match-detail-link" href={`/games/${game.id}`}>상세 정보 보기 <span aria-hidden="true">↗</span></Link>{canDelete && <DeleteGameButton gameId={game.id} />}</div>
    </div>
    <div className="match-teams">
      {(['BLUE', 'RED'] as Team[]).map((team, index) => <div className={`match-team-wrap ${team.toLowerCase()} ${game.winning_team === team ? 'winner' : ''}`} key={team}>
        {index === 1 && <span className="match-vs">VS</span>}
        <div className="match-team"><div className={`team-caption ${team.toLowerCase()}`}><strong>● {team} TEAM</strong><span>{game.winning_team === team ? 'WIN' : 'LOSE'}</span></div>
          <div className="roster-line">{game.participants.filter(p => p.team === team).map(p => <div className="player-entry" key={p.player_id}>
            <small className="player-entry-slot">SLOT {String(p.slot).padStart(2, '0')}</small>
            <div className="player-entry-name"><b>{p.name}</b>{p.nickname && <i>{p.nickname}</i>}</div>
            <em className={`player-entry-streak ${game.winning_team === team ? 'win' : 'loss'}`} title="이 경기까지의 연속 결과">{p.streak}연{game.winning_team === team ? '승' : '패'}</em>
          </div>)}</div>
        </div>
      </div>)}
    </div>
    <div className="match-card-bottom"><time dateTime={game.played_at.toISOString()}>◷ {gameDate(game.played_at)}</time> | <span>{game.participants.length / 2} : {game.participants.length / 2}</span></div>
  </article>;
}
