'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createPlayer } from '@/lib/players';
import { createGame, type ParticipantInput, type Team } from '@/lib/games';
import { getPlayers } from '@/lib/players';

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function registerPlayer(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const nickname = String(formData.get('nickname') ?? '').trim();
  if (!name || name.length > 100 || nickname.length > 100) {
    fail('/players/new', '이름을 입력하고 각 항목을 100자 이내로 작성해 주세요.');
  }
  try {
    await createPlayer(name, nickname || null);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      fail('/players/new', '이미 등록된 이름과 닉네임입니다.');
    }
    throw error;
  }
  revalidatePath('/games/new');
  redirect('/games/new');
}

export async function registerGame(formData: FormData) {
  const path = '/games/new';
  const winningTeam = String(formData.get('winningTeam') ?? '');
  if (winningTeam !== 'BLUE' && winningTeam !== 'RED') fail(path, '승리 팀을 선택해 주세요.');

  const rawStake = String(formData.get('stake') ?? '');
  const stake = Number(rawStake);
  if (!/^\d+$/.test(rawStake) || !Number.isSafeInteger(stake) || stake > 2147483647) {
    fail(path, '판돈은 0 이상의 정수로 입력해 주세요.');
  }

  const rawPlayedAt = String(formData.get('playedAt') ?? '');
  const playedAt = new Date(`${rawPlayedAt}:00+09:00`);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawPlayedAt) || Number.isNaN(playedAt.getTime())) {
    fail(path, '경기 시각을 입력해 주세요.');
  }

  const participants: ParticipantInput[] = [];
  for (const team of ['BLUE', 'RED'] as Team[]) {
    for (let slot = 1; slot <= 5; slot++) {
      const playerId = String(formData.get(`${team.toLowerCase()}_${slot}`) ?? '');
      if (playerId) {
        if (!/^\d+$/.test(playerId)) fail(path, '플레이어를 다시 선택해 주세요.');
        participants.push({ playerId, team, slot });
      }
    }
  }
  const blueCount = participants.filter((p) => p.team === 'BLUE').length;
  const redCount = participants.filter((p) => p.team === 'RED').length;
  if (blueCount === 0 || blueCount !== redCount) fail(path, '양 팀에 같은 수의 플레이어를 선택해 주세요.');

  const ids = participants.map((p) => p.playerId);
  if (new Set(ids).size !== ids.length) fail(path, '같은 플레이어를 두 번 선택할 수 없습니다.');
  const knownPlayers = await getPlayers();
  const knownIds = new Set(knownPlayers.map((p) => p.id));
  if (ids.some((id) => !knownIds.has(id))) fail(path, '등록되지 않은 플레이어가 포함되어 있습니다.');

  const id = await createGame({ playedAt, winningTeam, stake, participants });
  revalidatePath('/games');
  redirect(`/games/${id}`);
}
