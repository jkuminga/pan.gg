import Link from 'next/link';
import { registerGame } from '@/app/actions';
import { getPlayers } from '@/lib/players';
import SubmitButton from '@/app/submit-button';

export const dynamic = 'force-dynamic';

export default async function NewGame({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, players] = await Promise.all([searchParams, getPlayers()]);
  return <>
    <div className="page-heading"><div><p className="eyebrow">GAMES / NEW</p><h1>게임 기록 등록</h1><p>등록된 플레이어를 팀별로 선택하세요. 양 팀 인원은 같아야 합니다.</p></div><Link className="text-link" href="/players/new">+ 플레이어 추가</Link></div>
    {players.length < 2 ? <div className="empty panel">경기를 등록하려면 플레이어가 두 명 이상 필요합니다. <Link href="/players/new">플레이어 등록하기 →</Link></div> :
    <form action={registerGame} className="panel form-panel wide">
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-grid">
        {(['BLUE', 'RED'] as const).map((team) => <fieldset key={team} className="team-fieldset"><legend className={team === 'BLUE' ? 'blue' : 'red'}>{team} TEAM</legend>
          {Array.from({ length: 5 }, (_, i) => <label key={i}>플레이어 {i + 1}<select name={`${team.toLowerCase()}_${i + 1}`} defaultValue=""><option value="">선택 안 함</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name}{player.nickname ? ` (${player.nickname})` : ''}</option>)}</select></label>)}
        </fieldset>)}
      </div>
      <div className="form-grid settings">
        <label>경기 시각 <span className="required">필수</span><input type="datetime-local" name="playedAt" required /></label>
        <label>승리 팀 <span className="required">필수</span><select name="winningTeam" defaultValue="BLUE"><option value="BLUE">BLUE</option><option value="RED">RED</option></select></label>
        <label>1인당 판돈 (원) <span className="required">필수</span><input type="number" name="stake" min="0" max="2147483647" step="1" defaultValue="0" required /></label>
      </div>
      <div className="form-actions"><Link className="text-link" href="/games">취소</Link><SubmitButton>게임 저장</SubmitButton></div>
    </form>}
  </>;
}
