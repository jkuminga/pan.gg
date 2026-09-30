import { getPlayers } from '@/lib/players';
import GameForm from './game-form';

export const dynamic = 'force-dynamic';

export default async function NewGame({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, players] = await Promise.all([searchParams, getPlayers()]);
  return <GameForm players={players} error={error} />;
}
