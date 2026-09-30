'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Player } from '@/lib/players';
import type { Team } from '@/lib/games';
import { registerGame } from '@/app/actions';
import SubmitButton from '@/app/submit-button';

function koreaNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export default function GameForm({ players, error }: { players: Player[]; error?: string }) {
  const [roster, setRoster] = useState<Record<Team, string[]>>({ BLUE: [], RED: [] });
  const [winner, setWinner] = useState<Team>('BLUE');
  const [modalTeam, setModalTeam] = useState<Team | null>(null);
  const [search, setSearch] = useState('');
  const [stake, setStake] = useState(0);
  const [playedAt, setPlayedAt] = useState('');
  useEffect(() => { setPlayedAt(koreaNow()); }, []);
  const assigned = new Set([...roster.BLUE, ...roster.RED]);
  const filtered = players.filter(p => `${p.name} ${p.nickname ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const pick = (playerId: string) => {
    if (!modalTeam || assigned.has(playerId) || roster[modalTeam].length >= 5) return;
    setRoster(current => ({ ...current, [modalTeam]: [...current[modalTeam], playerId] }));
    setModalTeam(null);
    setSearch('');
  };
  const remove = (team: Team, playerId: string) => setRoster(current => ({ ...current, [team]: current[team].filter(id => id !== playerId) }));
  return <>
    <div className="page-heading"><div><p className="eyebrow">● MATCH RECORD PROTOCOL / FLEXIBLE ROSTER</p><h1>신규 경기 전적 등록</h1><p>양 팀에 같은 인원을 배치하세요. 각 팀 1~5명까지 가능합니다.</p></div><div className="heading-stat">팀 인원 <strong>{roster.BLUE.length} : {roster.RED.length}</strong></div></div>
    <form action={registerGame} className="game-entry-form">
      {error && <p className="error" role="alert">{error}</p>}
      <div className="game-settings">
        <label>경기 일시<input type="datetime-local" name="playedAt" value={playedAt} onChange={event => setPlayedAt(event.target.value)} required /></label>
        <label>1인당 판돈<input type="number" name="stake" min="0" max="2147483647" step="1" value={stake} onChange={event => setStake(Number(event.target.value))} required /><span className="stake-presets">{[0, 10000, 30000, 50000].map(value => <button type="button" key={value} onClick={() => setStake(current => value === 0 ? 0 : Math.min(2147483647, current + value))}>{value === 0 ? '0원' : `+${value / 10000}만`}</button>)}</span></label>
        <fieldset><legend>승리 진영 결정</legend><input type="hidden" name="winningTeam" value={winner} /><div className="winner-toggle"><button type="button" className={winner === 'BLUE' ? 'selected blue' : ''} onClick={() => setWinner('BLUE')}>BLUE 팀 승리</button><button type="button" className={winner === 'RED' ? 'selected red' : ''} onClick={() => setWinner('RED')}>RED 팀 승리</button></div></fieldset>
      </div>
      <div className="entry-teams">{(['BLUE', 'RED'] as Team[]).map(team => <section className={`entry-team ${team.toLowerCase()}`} key={team}><div className="entry-team-head"><h2>{team} TEAM</h2><span>{roster[team].length} / 5명 · {winner === team ? '승리' : '패배'}</span></div><div className="entry-slots">{roster[team].map((id, index) => { const p = players.find(player => player.id === id); return <div className="entry-slot" key={id}><span className="slot-code">SLOT {index + 1}</span><strong>{p?.name} {p?.nickname && <small>({p.nickname})</small>}</strong><button type="button" aria-label={`${p?.name} 제거`} onClick={() => remove(team, id)}>×</button><input type="hidden" name={`${team.toLowerCase()}_${index + 1}`} value={id} /></div>; })}{roster[team].length < 5 && <button className="add-slot" type="button" onClick={() => { setModalTeam(team); setSearch(''); }}>⊕ 플레이어 추가</button>}</div></section>)}</div>
      <div className="entry-note"><span>● 경기마다 참가 인원을 다르게 설정할 수 있습니다. 양 팀 인원만 같으면 됩니다.</span><span>같은 플레이어는 한 경기에서 한 번만 선택할 수 있습니다.</span></div>
      <div className="entry-actions"><Link href="/games">취소</Link><SubmitButton>경기 전적 저장하기</SubmitButton></div>
    </form>
    {modalTeam && <div className="modal-backdrop" role="presentation" onClick={() => setModalTeam(null)}><div className="player-modal" role="dialog" aria-modal="true" aria-label="참가 플레이어 선택" onClick={event => event.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">{modalTeam} TEAM / SLOT {roster[modalTeam].length + 1}</p><h2>참가 플레이어 선택</h2><p>등록된 플레이어를 선택해 슬롯에 배치하세요.</p></div><button type="button" aria-label="닫기" onClick={() => setModalTeam(null)}>×</button></div><div className="modal-search"><input autoFocus placeholder="이름 또는 닉네임 검색" value={search} onChange={event => setSearch(event.target.value)} /><span>전체 {players.length}명 · 선택 가능 {players.length - assigned.size}명</span></div><div className="modal-player-grid">{filtered.map(p => <button type="button" disabled={assigned.has(p.id)} onClick={() => pick(p.id)} key={p.id}><strong>{p.name}</strong><small>{p.nickname || '닉네임 미지정'}</small><span>{assigned.has(p.id) ? '배치 완료' : '선택하기'}</span></button>)}{filtered.length === 0 && <p>검색 결과가 없습니다.</p>}</div><div className="modal-footer"><span>원하는 플레이어가 없나요? <Link href="/players/new">새 플레이어 등록 →</Link></span><button type="button" onClick={() => setModalTeam(null)}>닫기</button></div></div></div>}
  </>;
}
