import { getPlayers } from '@/lib/players';
import LadderClient from './ladder-client';
import './ladder.css';

export const dynamic = 'force-dynamic';

export default async function LadderPage() {
  const players = await getPlayers();
  return <LadderClient players={players} />;
}
