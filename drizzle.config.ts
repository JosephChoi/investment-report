import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { join } from 'path';

// 환경 변수 로드 (.env.local 파일에서)
dotenv.config({ path: join(process.cwd(), '.env.local') });

// 데이터베이스 URL 확인
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL이 환경 변수에 설정되어 있지 않습니다.');
}

// Drizzle 설정
export default defineConfig({
  schema: './db/schema/index.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
}); 