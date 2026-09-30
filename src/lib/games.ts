import { db, requireDatabase } from './db';

export type Team = 'BLUE' | 'RED';
export type ParticipantInput = { playerId: string; team: Team; slot: number };
export type Participant = { player_id: string; name: string; nickname: string | null; team: Team; slot: number };
export type Game = { id: string; played_at: Date; winning_team: Team; stake: number; participants: Participant[] };

export async function createGame(input: {
  playedAt: Date;
  winningTeam: Team;
  stake: number;
  participants: ParticipantInput[];
}) {
  requireDatabase();
  const client = await db.connect();
  try {
    await client.query('begin');
    const game = await client.query<{ id: string }>(
      'insert into game_histories (played_at, winning_team, stake) values ($1, $2, $3) returning id',
      [input.playedAt, input.winningTeam, input.stake],
    );
    const id = game.rows[0].id;
    for (const participant of input.participants) {
      await client.query(
        'insert into game_participants (game_history_id, player_id, team, slot) values ($1, $2, $3, $4)',
        [id, participant.playerId, participant.team, participant.slot],
      );
    }
    await client.query('commit');
    return id;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

const gameSelect = `
  select g.id, g.played_at, g.winning_team, g.stake,
    coalesce(json_agg(json_build_object(
      'player_id', p.id, 'name', p.name, 'nickname', p.nickname,
      'team', gp.team, 'slot', gp.slot
    ) order by gp.team, gp.slot) filter (where p.id is not null), '[]') as participants
  from game_histories g
  left join game_participants gp on gp.game_history_id = g.id
  left join players p on p.id = gp.player_id
`;

export async function getGames(filters: { query?: string; winner?: Team; limit?: number } = {}): Promise<Game[]> {
  requireDatabase();
  const query = filters.query?.trim() ?? '';
  const winner = filters.winner ?? null;
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  const result = await db.query<Game>(`${gameSelect}
    where ($1::text = '' or g.id::text = $1 or exists (
      select 1 from game_participants search_gp join players search_p on search_p.id = search_gp.player_id
      where search_gp.game_history_id = g.id and (search_p.name ilike '%' || $1 || '%' or search_p.nickname ilike '%' || $1 || '%')
    )) and ($2::text is null or g.winning_team = $2)
    group by g.id order by g.played_at desc, g.id desc limit $3`, [query, winner, limit]);
  return result.rows;
}

export async function getGameSummary() {
  requireDatabase();
  const result = await db.query<{ games: number; players: number; total_stake: string; blue_wins: number; red_wins: number }>(`
    select (select count(*)::int from game_histories) as games,
      (select count(*)::int from players) as players,
      (select coalesce(sum(g.stake * counts.player_count), 0)::text from game_histories g
        join (select game_history_id, count(*)::int as player_count from game_participants group by game_history_id) counts on counts.game_history_id = g.id) as total_stake,
      (select count(*)::int from game_histories where winning_team = 'BLUE') as blue_wins,
      (select count(*)::int from game_histories where winning_team = 'RED') as red_wins
  `);
  return result.rows[0];
}

export async function getGame(id: string): Promise<Game | null> {
  requireDatabase();
  const result = await db.query<Game>(`${gameSelect}
    where g.id = $1 group by g.id`, [id]);
  return result.rows[0] ?? null;
}
