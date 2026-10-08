import { db, requireDatabase } from './db';
import type { Team } from './games';

export type StatisticsRange = { from: Date | null; to: Date | null };

export type StatisticsOverview = {
  games: number;
  players: number;
  active_players: number;
  blue_wins: number;
  red_wins: number;
  total_stake: string;
  average_stake: number;
  highest_stake: number;
};

export type PlayerStatistics = {
  id: string;
  name: string;
  nickname: string | null;
  games: number;
  wins: number;
  losses: number;
  net_amount: string;
  gained_amount: string;
  lost_amount: string;
  total_stake: string;
  recent_game: Date | null;
  blue_games: number;
  blue_wins: number;
  blue_net: string;
  red_games: number;
  red_wins: number;
  red_net: string;
};

export type PlayerMatchResult = {
  id: string;
  played_at: Date;
  team: Team;
  winning_team: Team;
  stake: number;
};

export async function getStatisticsOverview(): Promise<StatisticsOverview> {
  requireDatabase();
  const result = await db.query<StatisticsOverview>(`
    select
      (select count(*)::int from game_histories) as games,
      (select count(*)::int from players) as players,
      (select count(distinct player_id)::int from game_participants) as active_players,
      (select count(*)::int from game_histories where winning_team = 'BLUE') as blue_wins,
      (select count(*)::int from game_histories where winning_team = 'RED') as red_wins,
      (select coalesce(sum(g.stake::bigint * counts.player_count), 0)::text
        from game_histories g join (
          select game_history_id, count(*)::int as player_count
          from game_participants group by game_history_id
        ) counts on counts.game_history_id = g.id) as total_stake,
      (select coalesce(round(avg(stake))::int, 0) from game_histories) as average_stake,
      (select coalesce(max(stake), 0)::int from game_histories) as highest_stake
  `);
  return result.rows[0];
}

export async function getPlayerStatistics(range: StatisticsRange): Promise<PlayerStatistics[]> {
  requireDatabase();
  const result = await db.query<PlayerStatistics>(`
    with matches as (
      select gp.player_id, gp.team, g.id, g.played_at, g.winning_team, g.stake
      from game_participants gp
      join game_histories g on g.id = gp.game_history_id
      where ($1::timestamptz is null or g.played_at >= $1)
        and ($2::timestamptz is null or g.played_at < $2)
    )
    select p.id, p.name, p.nickname,
      count(m.id)::int as games,
      count(m.id) filter (where m.team = m.winning_team)::int as wins,
      count(m.id) filter (where m.team <> m.winning_team)::int as losses,
      coalesce(sum(case when m.team = m.winning_team then m.stake else -m.stake end), 0)::text as net_amount,
      coalesce(sum(m.stake) filter (where m.team = m.winning_team), 0)::text as gained_amount,
      coalesce(sum(m.stake) filter (where m.team <> m.winning_team), 0)::text as lost_amount,
      coalesce(sum(m.stake), 0)::text as total_stake,
      max(m.played_at) as recent_game,
      count(m.id) filter (where m.team = 'BLUE')::int as blue_games,
      count(m.id) filter (where m.team = 'BLUE' and m.winning_team = 'BLUE')::int as blue_wins,
      coalesce(sum(case when m.team = 'BLUE' then case when m.winning_team = 'BLUE' then m.stake else -m.stake end else 0 end), 0)::text as blue_net,
      count(m.id) filter (where m.team = 'RED')::int as red_games,
      count(m.id) filter (where m.team = 'RED' and m.winning_team = 'RED')::int as red_wins,
      coalesce(sum(case when m.team = 'RED' then case when m.winning_team = 'RED' then m.stake else -m.stake end else 0 end), 0)::text as red_net
    from players p left join matches m on m.player_id = p.id
    group by p.id order by p.name, p.id
  `, [range.from, range.to]);
  return result.rows;
}

export async function getPlayerMatchResults(playerId: string, range: StatisticsRange): Promise<PlayerMatchResult[]> {
  requireDatabase();
  const result = await db.query<PlayerMatchResult>(`
    select g.id, g.played_at, gp.team, g.winning_team, g.stake
    from game_participants gp join game_histories g on g.id = gp.game_history_id
    where gp.player_id = $1
      and ($2::timestamptz is null or g.played_at >= $2)
      and ($3::timestamptz is null or g.played_at < $3)
    order by g.played_at, g.id
  `, [playerId, range.from, range.to]);
  return result.rows;
}
