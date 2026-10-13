import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const cookieName = 'pan_admin';
const sessionAge = 60 * 60 * 24 * 7;

function adminPassword() {
  return process.env.ADMIN_PASSWORD || null;
}

function signature(expires: string, password: string) {
  return createHmac('sha256', password).update(`pan-admin:${expires}`).digest('hex');
}

export function adminConfigured() {
  return adminPassword() !== null;
}

export function validAdminPassword(value: unknown) {
  const password = adminPassword();
  if (!password || typeof value !== 'string') return false;
  const actual = Buffer.from(value);
  const expected = Buffer.from(password);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createAdminSession() {
  const password = adminPassword();
  if (!password) throw new Error('ADMIN_PASSWORD 환경 변수가 없습니다.');
  const expires = String(Date.now() + sessionAge * 1000);
  return {
    name: cookieName,
    value: `${expires}.${signature(expires, password)}`,
    options: { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: sessionAge },
  };
}

export function adminCookieName() {
  return cookieName;
}

export async function isAdmin() {
  const password = adminPassword();
  const value = (await cookies()).get(cookieName)?.value;
  if (!password || !value) return false;
  const [expires, received, extra] = value.split('.');
  if (extra || !/^\d{13}$/.test(expires ?? '') || !/^[a-f0-9]{64}$/.test(received ?? '') || Number(expires) <= Date.now()) return false;
  const actual = Buffer.from(received, 'hex');
  const expected = Buffer.from(signature(expires, password), 'hex');
  return timingSafeEqual(actual, expected);
}
