import Link from 'next/link';
import { gameDate, won } from '@/lib/format';
import { getPlayerMatchResults, getPlayerStatistics, getStatisticsOverview, type PlayerMatchResult, type PlayerStatistics, type StatisticsRange } from '@/lib/statistics';
import PlayerPicker from './player-picker';
import './statistics.css';

export const dynamic = 'force-dynamic';

type Search = { player?: string; period?: string; from?: string; to?: string; sort?: string; page?: string };
type Sort = 'net' | 'wins' | 'winrate';

function parseDay(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return new Date(`${value}T00:00:00+09:00`);
}

function getRange(search: Search): { period: 'all' | '30' | 'custom'; range: StatisticsRange; from: string; to: string } {
  if (search.period === '30') return { period: '30', range: { from: new Date(Date.now() - 30 * 86400000), to: null }, from: '', to: '' };
  const from = parseDay(search.from);
  const to = parseDay(search.to);
  if (search.period === 'custom' && (from || to) && (!from || !to || from <= to)) {
    return { period: 'custom', range: { from, to: to ? new Date(to.getTime() + 86400000) : null }, from: from ? search.from! : '', to: to ? search.to! : '' };
  }
  return { period: 'all', range: { from: null, to: null }, from: '', to: '' };
}

function signedWon(value: number | string) {
  const number = Number(value);
  return `${number > 0 ? '+' : number < 0 ? '-' : ''}${won(Math.abs(number))}`;
}

function chartDate(value: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(value);
}

function rate(wins: number, games: number) { return games ? (wins / games * 100).toFixed(1) : '0.0'; }

function streakOf(matches: PlayerMatchResult[]) {
  if (!matches.length) return { label: '경기 기록 없음', longest: 0 };
  const latestWin = matches.at(-1)!.team === matches.at(-1)!.winning_team;
  let current = 0;
  for (let index = matches.length - 1; index >= 0; index--) {
    if ((matches[index].team === matches[index].winning_team) !== latestWin) break;
    current++;
  }
  let longest = 0;
  let running = 0;
  for (const match of matches) {
    running = match.team === match.winning_team ? running + 1 : 0;
    longest = Math.max(longest, running);
  }
  return { label: `${current}연${latestWin ? '승' : '패'} 중`, longest };
}

function ProfitChart({ matches }: { matches: PlayerMatchResult[] }) {
  if (!matches.length) return <div className="stats-chart-empty">선택한 기간의 경기 기록이 없습니다.</div>;
  const values = [0];
  for (const match of matches) values.push(values.at(-1)! + (match.team === match.winning_team ? match.stake : -match.stake));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = maximum - minimum || 1;
  const x = (index: number) => 48 + index / (values.length - 1) * 680;
  const y = (value: number) => 22 + (maximum - value) / spread * 190;
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const baseline = y(0);
  const area = `48,${baseline} ${points} 728,${baseline}`;
  return <div className="stats-chart-frame">
    <svg viewBox="0 0 760 252" role="img" aria-label={`누적 손익 추이, 최종 ${signedWon(values.at(-1)!)}`} preserveAspectRatio="none">
      <defs><linearGradient id="stats-area" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#43e1d2" stopOpacity=".28" /><stop offset="1" stopColor="#43e1d2" stopOpacity="0" /></linearGradient></defs>
      {[0, .5, 1].map(fraction => <line key={fraction} x1="48" x2="728" y1={22 + fraction * 190} y2={22 + fraction * 190} className="stats-chart-grid" />)}
      <line x1="48" x2="728" y1={baseline} y2={baseline} className="stats-chart-zero" />
      <polygon points={area} fill="url(#stats-area)" />
      <polyline points={points} className="stats-chart-line" />
      {matches.map((match, index) => {
        const value = values[index + 1];
        const label = `경기 #${match.id} · ${gameDate(match.played_at)} · 누적 손익 ${signedWon(value)}`;
        const tooltipX = Math.min(Math.max(x(index + 1) - 83, 48), 562);
        const tooltipY = y(value) < 80 ? y(value) + 18 : y(value) - 57;
        return <g key={match.id} className="stats-chart-point" tabIndex={0} aria-label={label}>
          <circle cx={x(index + 1)} cy={y(value)} r="16" className="stats-chart-hit" />
          <circle cx={x(index + 1)} cy={y(value)} r={index === matches.length - 1 ? 5 : 3.5} className="stats-chart-dot" />
          <g className="stats-chart-tooltip" transform={`translate(${tooltipX}, ${tooltipY})`}>
            <rect width="166" height="47" rx="5" />
            <text x="10" y="17">#{match.id} · {chartDate(match.played_at)}</text>
            <text x="10" y="36">누적 손익 <tspan>{signedWon(value)}</tspan></text>
          </g>
        </g>;
      })}
      <text x="41" y={Math.min(244, baseline + 4)} textAnchor="end" className="stats-chart-label">₩0</text>
    </svg>
    <div className="stats-chart-axis"><span>시작</span><span>{gameDate(matches[0].played_at)} → {gameDate(matches.at(-1)!.played_at)}</span><strong>{signedWon(values.at(-1)!)}</strong></div>
  </div>;
}

function TeamPanel({ team, games, wins, net }: { team: 'BLUE' | 'RED'; games: number; wins: number; net: string }) {
  return <div className={`stats-side ${team.toLowerCase()}`}>
    <div className="stats-side-title"><strong>{team} TEAM</strong><b>{rate(wins, games)}%</b></div>
    <p>{games}전 {wins}승 {games - wins}패 <span className={Number(net) >= 0 ? 'stats-positive' : 'stats-negative'}>{signedWon(net)}</span></p>
    <div className="stats-side-track"><span style={{ width: `${rate(wins, games)}%` }} /></div>
  </div>;
}

function sortPlayers(players: PlayerStatistics[], sort: Sort) {
  return [...players].sort((a, b) => {
    const primary = sort === 'wins' ? b.wins - a.wins : sort === 'winrate' ? (b.games ? b.wins / b.games : -1) - (a.games ? a.wins / a.games : -1) : Number(b.net_amount) - Number(a.net_amount);
    return primary || b.games - a.games || a.name.localeCompare(b.name, 'ko-KR') || Number(a.id) - Number(b.id);
  });
}

export default async function StatisticsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const { period, range, from, to } = getRange(search);
  const sort: Sort = search.sort === 'wins' || search.sort === 'winrate' ? search.sort : 'net';
  const [overview, players] = await Promise.all([getStatisticsOverview(), getPlayerStatistics(range)]);
  const selected = players.find(player => player.id === search.player) ?? players[0];
  const matches = selected ? await getPlayerMatchResults(selected.id, range) : [];
  const streak = streakOf(matches);
  const ranked = sortPlayers(players, sort);
  const pageCount = Math.max(1, Math.ceil(ranked.length / 10));
  const requestedPage = Number(search.page);
  const page = Number.isInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), pageCount) : 1;
  const visible = ranked.slice((page - 1) * 10, page * 10);
  const bluePercent = overview.games ? overview.blue_wins / overview.games * 100 : 0;
  const redPercent = overview.games ? overview.red_wins / overview.games * 100 : 0;
  const href = (changes: Partial<Record<keyof Search, string | null>>) => {
    const params = new URLSearchParams();
    if (selected) params.set('player', selected.id);
    if (period !== 'all') params.set('period', period);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (sort !== 'net') params.set('sort', sort);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return `/statistics${params.size ? `?${params}` : ''}`;
  };

  return <div className="stats-page">
    <div className="stats-page-heading"><div><p className="eyebrow">● PAN.GG / MATCH TELEMETRY</p><h1>전체 통계</h1><p>저장된 경기와 플레이어 전적을 한곳에서 확인하세요.</p></div><Link className="button" href="/games/new">＋ 전적 등록</Link></div>
    <section className="stats-overview" aria-label="전체 경기 통계">
      <div className="stats-overview-card"><span className="stats-card-kicker">TOTAL MATCHES</span><strong>{overview.games.toLocaleString('ko-KR')} <small>경기</small></strong><p>등록 플레이어 {overview.players}명 · 활동 플레이어 {overview.active_players}명</p></div>
      <div className="stats-overview-card"><span className="stats-card-kicker">BLUE / RED WIN RATE</span><div className="stats-rate-label"><strong>{bluePercent.toFixed(1)}%</strong><strong>{redPercent.toFixed(1)}%</strong></div><div className="stats-rate-bar"><span style={{ width: `${bluePercent}%` }} /><span style={{ width: `${redPercent}%` }} /></div><p>BLUE {overview.blue_wins}승 · RED {overview.red_wins}승</p></div>
      <div className="stats-overview-card gold"><span className="stats-card-kicker">TOTAL PARTICIPATION STAKE</span><strong>{won(overview.total_stake)}</strong><p>모든 경기의 1인당 판돈 × 참가자 수</p></div>
      <div className="stats-overview-card"><span className="stats-card-kicker">STAKE PER PLAYER</span><div className="stats-stake-row"><span>평균</span><strong>{won(overview.average_stake)}</strong></div><div className="stats-stake-row"><span>최고</span><strong>{won(overview.highest_stake)}</strong></div><p>경기별 1인당 판돈 기준</p></div>
    </section>

    <section className="stats-individual" aria-labelledby="stats-individual-title">
      <div className="stats-section-heading"><div><p className="eyebrow">● PLAYER ANALYTICS</p><h2 id="stats-individual-title">플레이어별 상세 통계</h2><p>기간과 플레이어를 선택하면 지표·그래프·순위가 함께 바뀝니다.</p></div>
        <div className="stats-control-stack">
          <div className="stats-controls"><div className="stats-periods" role="group" aria-label="조회 기간"><Link className={period === 'all' ? 'active' : ''} href={href({ period: null, from: null, to: null, page: null })}>전체 기간</Link><Link className={period === '30' ? 'active' : ''} href={href({ period: '30', from: null, to: null, page: null })}>최근 30일</Link></div>
            {selected && <PlayerPicker selected={selected.name} options={players.map(player => ({ id: player.id, label: player.name, subtitle: player.nickname || `#${player.id}`, href: href({ player: player.id, page: null }) }))} />}
          </div>
          <form className="stats-date-range" action="/statistics" method="get"><span>직접 기간 선택</span><input type="hidden" name="period" value="custom" />{selected && <input type="hidden" name="player" value={selected.id} />}<input type="hidden" name="sort" value={sort} /><label>시작일 <input type="date" name="from" defaultValue={from} /></label><label>종료일 <input type="date" name="to" defaultValue={to} /></label><button type="submit">적용</button>{period === 'custom' && <span className="stats-period-note">선택한 기간 적용 중</span>}</form>
        </div>
      </div>

      {selected ? <>
        <div className="stats-player-banner" aria-label={`${selected.name} 플레이어 개요`}>
          <div className="stats-player-identity"><span className="stats-avatar">{selected.name.slice(0, 1)}</span><div><p className="eyebrow">PLAYER #{selected.id}</p><h3>{selected.name}</h3><small>{selected.nickname || '닉네임 미지정'}</small></div></div>
          <div className="stats-player-record"><small>선택 기간 전적</small><strong>{selected.games}전 {selected.wins}승 {selected.losses}패</strong><span>승률 {rate(selected.wins, selected.games)}%</span></div>
          <div className="stats-streak"><small>최근 경기</small><strong>{selected.recent_game ? gameDate(selected.recent_game) : '없음'}</strong><span>{streak.label}</span><small>선택 기간 최장 {streak.longest}연승</small></div>
        </div>
        <div className="stats-player-metrics"><div className="stats-metric primary"><span>누적 순손익</span><strong className={Number(selected.net_amount) >= 0 ? 'stats-positive' : 'stats-negative'}>{signedWon(selected.net_amount)}</strong></div><div className="stats-metric"><span>총 획득액</span><strong className="stats-positive">{won(selected.gained_amount)}</strong></div><div className="stats-metric"><span>총 손실액</span><strong className="stats-negative">{won(selected.lost_amount)}</strong></div><div className="stats-metric"><span>누적 참가 판돈</span><strong>{won(selected.total_stake)}</strong></div></div>
        <div className="stats-analysis-grid"><section className="stats-panel"><div className="stats-panel-title"><div><p className="eyebrow">PROFIT / LOSS</p><h3>누적 손익 추이</h3></div><span>선택 기간 · {matches.length}경기</span></div><ProfitChart matches={matches} /></section><section className="stats-panel"><div className="stats-panel-title"><div><p className="eyebrow">SIDE SPLIT</p><h3>진영별 분석</h3></div></div><div className="stats-sides"><TeamPanel team="BLUE" games={selected.blue_games} wins={selected.blue_wins} net={selected.blue_net} /><TeamPanel team="RED" games={selected.red_games} wins={selected.red_wins} net={selected.red_net} /></div></section></div>
      </> : <div className="stats-empty">등록된 플레이어가 없습니다. <Link href="/players/new">플레이어 등록하기 →</Link></div>}

      <section className="stats-panel stats-leaderboard"><div className="stats-panel-title"><div><p className="eyebrow">LEADERBOARD</p><h3>플레이어 순위</h3></div><div className="stats-sort" role="group" aria-label="순위 기준"><Link className={sort === 'net' ? 'active' : ''} href={href({ sort: 'net', page: null })}>순손익</Link><Link className={sort === 'wins' ? 'active' : ''} href={href({ sort: 'wins', page: null })}>다승</Link><Link className={sort === 'winrate' ? 'active' : ''} href={href({ sort: 'winrate', page: null })}>승률</Link></div></div><p className="stats-leaderboard-note">선택한 기간의 기록입니다. 승률은 경기 수가 적은 플레이어도 포함하므로 경기 수를 함께 확인하세요.</p>
        <div className="stats-table-scroll"><table><thead><tr><th>순위</th><th>플레이어</th><th>경기 (승-패)</th><th>승률</th><th>BLUE / RED</th><th>누적 참가 판돈</th><th>순손익</th><th>최근 경기</th></tr></thead><tbody>{visible.map((player, index) => <tr key={player.id} className={player.id === selected?.id ? 'selected' : ''}><td>{(page - 1) * 10 + index + 1}</td><td><Link href={href({ player: player.id })}>{player.name}</Link><small>{player.nickname || `#${player.id}`}</small></td><td>{player.games}전 ({player.wins}승 {player.losses}패)</td><td><strong>{rate(player.wins, player.games)}%</strong><div className="stats-table-rate"><span style={{ width: `${rate(player.wins, player.games)}%` }} /></div></td><td><span className="stats-blue">{player.blue_wins}-{player.blue_games - player.blue_wins}</span> / <span className="stats-red">{player.red_wins}-{player.red_games - player.red_wins}</span></td><td>{won(player.total_stake)}</td><td className={Number(player.net_amount) >= 0 ? 'stats-positive' : 'stats-negative'}>{signedWon(player.net_amount)}</td><td>{player.recent_game ? gameDate(player.recent_game) : '—'}</td></tr>)}</tbody></table>{!visible.length && <p className="stats-empty">표시할 플레이어가 없습니다.</p>}</div>
        {pageCount > 1 && <div className="stats-pagination"><Link href={href({ page: String(Math.max(1, page - 1)) })} aria-disabled={page === 1}>이전</Link><span>{page} / {pageCount}</span><Link href={href({ page: String(Math.min(pageCount, page + 1)) })} aria-disabled={page === pageCount}>다음</Link></div>}
      </section>
    </section>
  </div>;
}
