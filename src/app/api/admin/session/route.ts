import { NextResponse } from 'next/server';
import { adminConfigured, adminCookieName, createAdminSession, validAdminPassword } from '@/lib/admin-auth';

export async function POST(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ error: '관리자 비밀번호가 설정되지 않았습니다.' }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!validAdminPassword(body?.password)) return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  const session = createAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(session.name, session.value, session.options);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), '', { path: '/', maxAge: 0 });
  return response;
}
