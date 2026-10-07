export type LadderParticipant = { key: string; label: string; playerId?: string };
export type LadderRun = {
  id: string;
  createdAt: string;
  participants: LadderParticipant[];
  layers: number[][];
  bottomOrder: number[];
};

function randomBelow(max: number): number {
  const range = 0x100000000;
  const limit = range - (range % max);
  const sample = new Uint32Array(1);
  do { crypto.getRandomValues(sample); } while (sample[0] >= limit);
  return sample[0] % max;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createLadder(participants: LadderParticipant[]): LadderRun {
  const count = participants.length;
  if (![4, 6, 8, 10].includes(count)) throw new Error('참가자는 4·6·8·10명이어야 합니다.');
  const bottomOrder = shuffle(Array.from({ length: count }, (_, index) => index));
  const targetRank = new Array<number>(count);
  bottomOrder.forEach((startIndex, bottomIndex) => { targetRank[startIndex] = bottomIndex; });
  const current = Array.from({ length: count }, (_, index) => index);
  const layers: number[][] = [];

  // Odd-even transposition: one layer never contains overlapping bridges.
  for (let layer = 0; layer < count; layer++) {
    const bridges: number[] = [];
    for (let column = layer % 2; column < count - 1; column += 2) {
      if (targetRank[current[column]] > targetRank[current[column + 1]]) {
        [current[column], current[column + 1]] = [current[column + 1], current[column]];
        bridges.push(column);
      }
    }
    layers.push(bridges);
  }
  if (current.some((startIndex, bottomIndex) => startIndex !== bottomOrder[bottomIndex])) {
    throw new Error('사다리 경로 생성에 실패했습니다.');
  }
  return { id: crypto.randomUUID(), createdAt: new Date().toISOString(), participants: [...participants], layers, bottomOrder };
}

export function traceLadder(layers: number[][], startIndex: number): number[] {
  const columns = [startIndex];
  let column = startIndex;
  for (const bridges of layers) {
    if (bridges.includes(column)) column += 1;
    else if (bridges.includes(column - 1)) column -= 1;
    columns.push(column);
  }
  return columns;
}

export function pathPoints(columns: number[], left: number, gap: number, top: number, rowGap: number, bottom: number): string {
  const points = [`${left + columns[0] * gap},${top}`];
  for (let row = 0; row < columns.length - 1; row++) {
    const y = top + 20 + row * rowGap;
    points.push(`${left + columns[row] * gap},${y}`);
    if (columns[row + 1] !== columns[row]) points.push(`${left + columns[row + 1] * gap},${y}`);
  }
  points.push(`${left + columns.at(-1)! * gap},${bottom}`);
  return points.join(' ');
}
