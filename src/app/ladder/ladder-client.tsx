'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Player } from '@/lib/players';
import { createLadder, pathPoints, traceLadder, type LadderParticipant, type LadderRun } from '@/lib/ladder';

type Team = 'BLUE' | 'RED';
const sizes = [4, 6, 8, 10] as const;
const storageKey = 'pan-ladder-session-v1';

function teamOf(bottom: number, size: number): Team { return bottom < size / 2 ? 'BLUE' : 'RED'; }
function labelKey(value: string) { return value.trim().toLocaleLowerCase('ko-KR'); }
function displayPlayer(player: Player) { return player.nickname ? `${player.name} (${player.nickname})` : player.name; }

export default function LadderClient({ players }: { players: Player[] }) {
  const [size, setSize] = useState(4);
  const [slots, setSlots] = useState<(LadderParticipant | null)[]>(Array(4).fill(null));
  const [run, setRun] = useState<LadderRun | null>(null);
  const [history, setHistory] = useState<LadderRun[]>([]);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [revealAll, setRevealAll] = useState(false);
  const [modalSlot, setModalSlot] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [manual, setManual] = useState('');
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (saved && sizes.includes(saved.size) && Array.isArray(saved.slots) && saved.slots.length === saved.size) {
        setSize(saved.size); setSlots(saved.slots);
        if (saved.run) setRun(saved.run);
        if (Array.isArray(saved.history)) setHistory(saved.history.slice(0, 8));
      }
    } catch { /* Ignore a damaged browser session. */ }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (restored) sessionStorage.setItem(storageKey, JSON.stringify({ size, slots, run, history }));
  }, [restored, size, slots, run, history]);
  useEffect(() => {
    if (modalSlot === null) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setModalSlot(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [modalSlot]);

  const assigned = new Set(slots.filter(Boolean).map(participant => participant!.key));
  const filled = slots.filter(Boolean).length;
  const ready = filled === size;
  const boardWidth = size * 146;
  const railLeft = 73;
  const railGap = 146;
  const railTop = 10;
  const rowGap = 27;
  const railBottom = railTop + 38 + size * rowGap;
  const currentPath = run && selectedStart !== null ? traceLadder(run.layers, selectedStart) : null;

  function invalidate(next: (LadderParticipant | null)[]) {
    setSlots(next); setRun(null); setHistory([]); setSelectedStart(null); setRevealAll(false); setError('');
  }
  function chooseSize(nextSize: number) {
    if (nextSize === size) return;
    if (slots.slice(nextSize).some(Boolean) && !window.confirm('초과한 출발 슬롯의 참가자가 제거됩니다. 계속할까요?')) return;
    setSize(nextSize); invalidate(Array.from({ length: nextSize }, (_, index) => slots[index] ?? null));
  }
  function place(index: number, participant: LadderParticipant) {
    if (index < 0 || index >= size) { setError('빈 출발 슬롯이 없습니다.'); return; }
    if (slots.some((slot, slotIndex) => slotIndex !== index && slot?.key === participant.key)) { setError('이미 배치된 참가자입니다.'); return; }
    if (slots.some((slot, slotIndex) => slotIndex !== index && slot && labelKey(slot.label) === labelKey(participant.label))) { setError('표시 이름이 같은 참가자가 있습니다. 이름을 구분해 주세요.'); return; }
    const registeredName = participant.playerId && players.find(player => player.id === participant.playerId)?.name;
    if (registeredName && slots.some((slot, slotIndex) => slotIndex !== index && slot && !slot.playerId && labelKey(slot.label) === labelKey(registeredName))) { setError('직접 입력한 이름과 등록 플레이어의 이름이 겹칩니다.'); return; }
    const next = [...slots]; next[index] = participant; invalidate(next); setModalSlot(null); setQuery(''); setManual('');
  }
  function addManual() {
    const names = manual.split(/[\n,]+/).map(value => value.trim()).filter(Boolean);
    if (!names.length) { setError('추가할 이름을 입력해 주세요.'); return; }
    const free = slots.map((slot, index) => slot ? -1 : index).filter(index => index >= 0);
    if (names.length > free.length) { setError(`빈 슬롯은 ${free.length}개입니다.`); return; }
    const existing = new Set(slots.filter(Boolean).flatMap(slot => {
      const name = slot!.playerId && players.find(player => player.id === slot!.playerId)?.name;
      return [labelKey(slot!.label), ...(name ? [labelKey(name)] : [])];
    }));
    for (const name of names) {
      if (name.length > 40 || existing.has(labelKey(name))) { setError('이름은 40자 이내로, 서로 다르게 입력해 주세요.'); return; }
      existing.add(labelKey(name));
    }
    const next = [...slots];
    const targetSlots = modalSlot !== null && modalSlot >= 0 && !slots[modalSlot] ? [modalSlot, ...free.filter(index => index !== modalSlot)] : free;
    names.forEach((name, i) => { next[targetSlots[i]] = { key: `manual:${crypto.randomUUID()}`, label: name }; });
    invalidate(next); setModalSlot(null); setManual(''); setQuery('');
  }
  function roll() {
    if (!ready) { setError(`출발 슬롯 ${size}개를 모두 채워 주세요. 현재 ${filled}명입니다.`); return; }
    const next = createLadder(slots as LadderParticipant[]);
    setRun(next); setHistory(current => [next, ...current].slice(0, 8)); setSelectedStart(null); setRevealAll(false); setError('');
  }
  function reset() {
    if (filled && !window.confirm('참가자와 이번 세션의 실행 기록을 모두 지울까요?')) return;
    invalidate(Array(size).fill(null));
  }
  function teamMembers(value: LadderRun, team: Team) {
    return value.bottomOrder.slice(team === 'BLUE' ? 0 : size / 2, team === 'BLUE' ? size / 2 : size).map(index => value.participants[index]);
  }
  const canPrefill = Boolean(run && run.participants.every(participant => participant.playerId));
  const prefillHref = run && canPrefill ? `/games/new?blue=${teamMembers(run, 'BLUE').map(p => p.playerId).join(',')}&red=${teamMembers(run, 'RED').map(p => p.playerId).join(',')}` : '';

  return <div className="ladder-page">
    <div className="page-heading ladder-heading"><div><p className="eyebrow">● AUTO TEAM SPLITTER / SCRIM ARBITRATION</p><h1>사다리 타기</h1><p>같은 참가자 조합으로 다시 굴려 BLUE와 RED 팀을 공정하게 나누세요.</p></div><div className="ladder-size-picker" role="group" aria-label="참가 인원">{sizes.map(value => <button key={value} type="button" className={size === value ? 'active' : ''} onClick={() => chooseSize(value)}>{value}인 <small>({value / 2}대{value / 2})</small></button>)}</div></div>
    <section className="ladder-board"><div className="ladder-board-head"><div><strong>출발 슬롯 <span>START SLOTS</span></strong><p>카드를 눌러 참가자를 배치하세요. 직접 입력과 등록 플레이어 선택을 섞어 쓸 수 있습니다.</p></div><div><button type="button" onClick={() => { if (ready) { setError('빈 출발 슬롯이 없습니다.'); return; } setModalSlot(slots.findIndex(slot => !slot)); setError(''); }}>⊕ 참가자 일괄 입력</button></div></div>
      {error && <p className="ladder-error" role="alert">{error}</p>}
      <div className="ladder-scroll"><div className="ladder-inner" style={{ width: boardWidth }}>
        <div className="ladder-starts" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>{slots.map((participant, index) => <div className={`ladder-start ${participant ? 'filled' : ''} ${run && (revealAll || selectedStart === index) ? teamOf(traceLadder(run.layers, index).at(-1)!, size).toLowerCase() : ''}`} key={index}><button className="ladder-start-main" type="button" onClick={() => { if (run && participant) { setSelectedStart(index); return; } setModalSlot(index); setError(''); }}><span className="ladder-slot-number">[{String(index + 1).padStart(2, '0')}]</span><strong>{participant?.label ?? '플레이어 선택'}</strong><small>{participant ? participant.playerId ? '등록 플레이어' : '직접 입력' : '클릭해서 추가'}</small></button>{participant && <button className="ladder-remove" type="button" aria-label={`${participant.label} 제거`} onClick={() => { const next = [...slots]; next[index] = null; invalidate(next); }}>×</button>}</div>)}</div>
        <svg className="ladder-svg" width="100%" height={railBottom + 18} viewBox={`0 0 ${boardWidth} ${railBottom + 18}`} preserveAspectRatio="none" role="img" aria-label={`${size}명 사다리 경로`}>
          {Array.from({ length: size }, (_, index) => <line key={`rail-${index}`} x1={railLeft + index * railGap} x2={railLeft + index * railGap} y1={railTop} y2={railBottom} className="ladder-rail" />)}
          {run?.layers.flatMap((bridges, row) => bridges.map(column => <line key={`${row}-${column}`} x1={railLeft + column * railGap} x2={railLeft + (column + 1) * railGap} y1={railTop + 20 + row * rowGap} y2={railTop + 20 + row * rowGap} className="ladder-bridge" />))}
          {run && revealAll && run.participants.map((_, index) => { const columns = traceLadder(run.layers, index); return <polyline key={index} pathLength={100} points={pathPoints(columns, railLeft, railGap, railTop, rowGap, railBottom)} className={`ladder-path ${teamOf(columns.at(-1)!, size).toLowerCase()} all`} />; })}
          {currentPath && <polyline pathLength={100} points={pathPoints(currentPath, railLeft, railGap, railTop, rowGap, railBottom)} className={`ladder-path ${teamOf(currentPath.at(-1)!, size).toLowerCase()}`} />}
        </svg>
        <div className="ladder-destinations" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>{Array.from({ length: size }, (_, index) => { const team = teamOf(index, size); const arriving = run?.participants[run.bottomOrder[index]]; const visible = Boolean(run && (revealAll || currentPath?.at(-1) === index)); return <div className={`ladder-destination ${team.toLowerCase()}`} key={index}><small>SLOT {String(index + 1).padStart(2, '0')}</small><strong>{team} TEAM</strong><span>{visible ? arriving?.label : '결과 대기'}</span></div>; })}</div>
        <div className="ladder-team-bands"><span>BLUE TEAM · {size / 2}명</span><span>RED TEAM · {size / 2}명</span></div>
      </div></div>
    </section>
    <div className="ladder-controls"><button type="button" className="button" onClick={roll}>🎲 {run ? '사다리 다시 굴리기' : '사다리 굴리기'}</button><button type="button" onClick={() => { if (run) { setRevealAll(true); setSelectedStart(null); } }} disabled={!run}>▶ 전체 결과 확인</button><button type="button" onClick={reset}>↺ 슬롯 초기화</button><span>{history.length ? `이번 설정 ${history.length}회 실행` : `${filled} / ${size}명 배치`}</span></div>
    <div className="ladder-results"><section className="ladder-roster"><div className="ladder-section-head"><h2>확정된 팀 배정 {run && <small>({size / 2}대{size / 2})</small>}</h2>{canPrefill && prefillHref && <Link href={prefillHref}>이 팀 구성으로 전적 등록하기 →</Link>}</div>{run && revealAll ? <div className="ladder-roster-grid">{(['BLUE', 'RED'] as Team[]).map(team => <div className={`ladder-roster-team ${team.toLowerCase()}`} key={team}><h3>{team} TEAM</h3>{teamMembers(run, team).map((participant, index) => <div key={participant.key}><span>{index + 1}</span><strong>{participant.label}</strong></div>)}</div>)}</div> : <p className="ladder-placeholder">{run ? '출발 카드를 눌러 경로를 보거나 전체 결과를 확인하세요.' : '참가자를 배치하고 사다리를 굴리면 팀 구성이 표시됩니다.'}</p>}{run && !canPrefill && revealAll && <p className="ladder-hint">직접 입력한 참가자는 먼저 플레이어로 등록해야 전적 등록 화면에 넘길 수 있습니다.</p>}</section><aside className="ladder-history"><div className="ladder-section-head"><h2>최근 세션 롤 기록</h2></div>{history.length ? <ol>{history.map((item, index) => <li key={item.id}><button type="button" onClick={() => { setRun(item); setRevealAll(true); setSelectedStart(null); }}><strong>{history.length - index}회차 · {new Date(item.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</strong><small>BLUE {teamMembers(item, 'BLUE').map(p => p.label).join(', ')}</small><small>RED {teamMembers(item, 'RED').map(p => p.label).join(', ')}</small></button></li>)}</ol> : <p className="ladder-placeholder">아직 굴린 기록이 없습니다.</p>}</aside></div>
    {modalSlot !== null && <div className="modal-backdrop" role="presentation" onClick={() => setModalSlot(null)}><div className="player-modal ladder-modal" role="dialog" aria-modal="true" aria-label="출발 슬롯 참가자 선택" onClick={event => event.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">START SLOT {modalSlot >= 0 ? String(modalSlot + 1).padStart(2, '0') : 'BULK'}</p><h2>출발 참가자 선택</h2><p>등록 플레이어를 고르거나 이름을 직접 입력하세요.</p></div><button type="button" aria-label="닫기" onClick={() => setModalSlot(null)}>×</button></div><div className="ladder-modal-body"><div><h3>등록 플레이어</h3><input autoFocus aria-label="등록 플레이어 검색" placeholder="이름 또는 닉네임 검색" value={query} onChange={event => setQuery(event.target.value)} /><div className="ladder-modal-players">{players.filter(player => displayPlayer(player).toLocaleLowerCase('ko-KR').includes(query.toLocaleLowerCase('ko-KR'))).map(player => <button type="button" key={player.id} disabled={assigned.has(`player:${player.id}`) && slots[modalSlot]?.key !== `player:${player.id}`} onClick={() => place(modalSlot >= 0 ? modalSlot : slots.findIndex(slot => !slot), { key: `player:${player.id}`, label: displayPlayer(player), playerId: player.id })}><strong>{player.name}</strong><small>{player.nickname || '닉네임 미지정'}</small><span>{assigned.has(`player:${player.id}`) ? '배치됨' : '선택'}</span></button>)}</div></div><div><h3>직접 입력 · 여러 줄 붙여넣기</h3><textarea aria-label="참가자 이름 직접 입력" placeholder={'참가자 이름을 한 줄에 하나씩 입력하세요.\n쉼표로 구분해도 됩니다.'} value={manual} onChange={event => setManual(event.target.value)} /><p>빈 슬롯부터 순서대로 채웁니다. 같은 이름은 중복 배치할 수 없습니다.</p><button type="button" className="button" onClick={addManual}>이름 추가하기</button></div></div>{error && <p className="ladder-error" role="alert">{error}</p>}<div className="modal-footer"><Link href="/players/new">새 플레이어 등록하기 →</Link><button type="button" onClick={() => setModalSlot(null)}>닫기</button></div></div></div>}
  </div>;
}
