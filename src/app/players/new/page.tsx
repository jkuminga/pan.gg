import Link from 'next/link';
import { registerPlayer } from '@/app/actions';
import SubmitButton from '@/app/submit-button';
import { getPlayerStats } from '@/lib/players';
import { won } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function NewPlayer({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const players = await getPlayerStats();
  return <>
    <div className="page-heading"><div><p className="eyebrow">● ROSTER TELEMETRY NODE</p><h1>플레이어 관리 및 등록</h1><p>참가자를 등록하고 누적 경기 기록을 확인하세요.</p></div><div className="heading-stat">등록된 플레이어 <strong>{players.length}명</strong></div></div>
    <div className="player-layout"><form action={registerPlayer} className="panel form-panel">
      <h2>⊕ 새 플레이어 등록</h2>
      {error && <p className="error" role="alert">{error}</p>}
      <label>이름 <span className="required">필수</span><input name="name" maxLength={100} required placeholder="예: 김민수" /></label>
      <label>소환사명 / 닉네임 <span className="hint">선택</span><input name="nickname" maxLength={100} placeholder="예: Hide on bush" /></label>
      <p className="form-note">동일한 이름과 닉네임 조합은 중복 등록되지 않습니다.</p>
      <div className="form-actions"><SubmitButton>플레이어 등록</SubmitButton></div>
    </form><section className="roster-section"><div className="roster-heading"><h2>☷ 등록된 플레이어 명단 <small>총 {players.length}명</small></h2><Link href="/games/new">+ 전적 등록</Link></div>
      {players.length ? <div className="player-grid">{players.map(player => { const net = Number(player.net_amount); return <article className="player-card" key={player.id}><div className="player-card-main"><span className="player-avatar">{player.name.slice(0, 1)}</span><div><strong>{player.name}</strong><small>닉네임: <b>{player.nickname || '미지정'}</b></small></div><div className="player-rate">{player.games}전 <strong>{player.games ? (player.wins / player.games * 100).toFixed(1) : '0.0'}%</strong></div></div><div className="player-card-stats"><span>{player.wins}승 {player.losses}패</span><span className={net >= 0 ? 'gain' : 'loss-text'}>순 판돈 {net > 0 ? '+' : net < 0 ? '-' : ''}{won(Math.abs(net))}</span></div></article>; })}</div> : <div className="empty-state">등록된 플레이어가 없습니다.</div>}
    </section></div>
  </>;
}
