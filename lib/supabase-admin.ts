import { createClient } from '@supabase/supabase-js';

// 서비스 역할 키를 사용하는 Supabase 클라이언트 생성
// 이 클라이언트는 RLS 정책을 우회할 수 있습니다.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
); 