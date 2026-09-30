import { db, requireDatabase } from './db';

export type Player = { id: string; name: string; nickname: string | null };
export type PlayerStat = Player & { games: number; wins: number; losses: number; net_amount: string };

export async function getPlayers(): Promise<Player[]> {
  requireDatabase();
  const result = await db.query<Player>('select id, name, nickname from players order by name, id');
  return result.rows;
}

export async function getPlayerStats(): Promise<PlayerStat[]> {
  requireDatabase();
  const result = await db.query<PlayerStat>(`
    select p.id, p.name, p.nickname,
      count(g.id)::int as games,
      count(g.id) filter (where gp.team = g.winning_team)::int as wins,
      count(g.id) filter (where gp.team <> g.winning_team)::int as losses,
      coalesce(sum(case when gp.team = g.winning_team then g.stake else -g.stake end), 0)::text as net_amount
    from players p
    left join game_participants gp on gp.player_id = p.id
    left join game_histories g on g.id = gp.game_history_id
    group by p.id order by p.name, p.id
  `);
  return result.rows;
}

export async function createPlayer(name: string, nickname: string | null) {
  requireDatabase();
  const result = await db.query<{ id: string }>(
    'insert into players (name, nickname) values ($1, $2) returning id',
    [name, nickname],
  );
  return result.rows[0].id;
}
