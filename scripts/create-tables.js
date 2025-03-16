// Supabase에 테이블을 생성하는 스크립트
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  try {
    // SQL 파일 읽기
    const sqlFilePath = path.join(__dirname, '../sql/overdue_tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // SQL 실행
    const { error } = await supabase.rpc('pgmoon.query', { query: sql });

    if (error) {
      throw error;
    }

    console.log('테이블이 성공적으로 생성되었습니다.');
  } catch (error) {
    console.error('테이블 생성 중 오류가 발생했습니다:', error);
  }
}

createTables(); 