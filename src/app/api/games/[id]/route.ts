import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { deleteGame } from '@/lib/games';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: '경기 번호가 올바르지 않습니다.' }, { status: 400 });
  if (!await deleteGame(id)) return NextResponse.json({ error: '경기를 찾을 수 없습니다.' }, { status: 404 });
  revalidatePath('/');
  revalidatePath('/games');
  revalidatePath('/statistics');
  return NextResponse.json({ ok: true });
}
