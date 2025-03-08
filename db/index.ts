import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { supabase } from '../lib/supabase';
import * as schema from './schema';

// 데이터베이스 연결 문자열 가져오기
const connectionString = process.env.DATABASE_URL;

// 연결 문자열이 없을 경우 에러 메시지 출력
if (!connectionString) {
  throw new Error('DATABASE_URL이 환경 변수에 설정되어 있지 않습니다.');
}

// 마이그레이션을 위한 PostgreSQL 클라이언트
const migrationClient = postgres(connectionString, { max: 1 });

// 쿼리를 위한 PostgreSQL 클라이언트
const queryClient = postgres(connectionString);

// DrizzleORM 인스턴스 생성
export const db = drizzle(queryClient, { schema });

// 마이그레이션 함수
export const runMigrations = async () => {
  await migrate(drizzle(migrationClient), {
    migrationsFolder: './db/migrations',
  });
}; 