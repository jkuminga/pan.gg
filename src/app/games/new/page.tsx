import { getPlayers } from '@/lib/players';
import GameForm from './game-form';

export const dynamic = 'force-dynamic';

export default async function NewGame({ searchParams }: { searchParams: Promise<{ error?: string; blue?: string; red?: string }> }) {
  const [{ error, blue, red }, players] = await Promise.all([searchParams, getPlayers()]);
  const known = new Set(players.map(player => player.id));
  const blueIds = blue?.split(',').filter(Boolean) ?? [];
  const redIds = red?.split(',').filter(Boolean) ?? [];
  const ids = [...blueIds, ...redIds];
  const valid = blueIds.length > 0 && blueIds.length <= 5 && blueIds.length === redIds.length &&
    ids.every(id => known.has(id)) && new Set(ids).size === ids.length;
  return <GameForm players={players} error={error} initialRoster={valid ? { BLUE: blueIds, RED: redIds } : undefined} />;
}
