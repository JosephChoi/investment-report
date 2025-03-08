import { createClient } from '@supabase/supabase-js';

// Supabase 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수가 없을 경우 에러 메시지 출력
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.');
}

// Supabase 클라이언트 생성
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

// 서비스 역할 키를 사용하는 클라이언트 (서버 측에서만 사용, RLS 우회)
export const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    // 서비스 키가 없으면 일반 클라이언트 반환
    return supabase;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}; 