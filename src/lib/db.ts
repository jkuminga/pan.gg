import 'server-only';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

export const db = new Pool({
  connectionString,
  max: 1,
  ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false },
});

export function requireDatabase() {
  if (!connectionString) throw new Error('DATABASE_URL 환경 변수가 없습니다.');
}
