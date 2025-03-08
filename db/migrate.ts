import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { join } from 'path';

// 환경 변수 로드
dotenv.config({ path: join(process.cwd(), '.env.local') });

// 데이터베이스 URL 확인
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL이 환경 변수에 설정되어 있지 않습니다.');
}

// 마이그레이션 실행
async function main() {
  console.log('마이그레이션을 시작합니다...');
  
  // 마이그레이션 클라이언트 생성
  const migrationClient = postgres(connectionString as string, { max: 1 });
  const db = drizzle(migrationClient);
  
  try {
    // 마이그레이션 실행
    await migrate(db, { migrationsFolder: 'db/migrations' });
    console.log('마이그레이션이 성공적으로 완료되었습니다.');
  } catch (error) {
    console.error('마이그레이션 중 오류가 발생했습니다:', error);
    process.exit(1);
  } finally {
    // 연결 종료
    await migrationClient.end();
  }
}

main(); 