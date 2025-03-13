import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 현재 로그인한 사용자 정보 반환 API
export async function GET(request: NextRequest) {
  try {
    // 현재 세션 가져오기
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: '로그인되지 않았습니다.' }, { status: 401 });
    }
    
    // 사용자 정보 반환
    return NextResponse.json({ 
      user: {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at
      }
    });
  } catch (error) {
    console.error('사용자 정보 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 