import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { OverduePaymentNoticeResponse } from '@/lib/overdue-types';

export async function GET(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('세션 정보:', session ? '세션 있음' : '세션 없음', sessionError ? `오류: ${sessionError.message}` : '오류 없음');
    
    if (sessionError || !session) {
      return NextResponse.json(
        {
          data: null,
          error: '인증되지 않은 사용자입니다. 다시 로그인해주세요.',
        },
        { status: 401 }
      );
    }
    
    // 최신 연체정보 안내문 조회 (서비스 역할 키 사용)
    const { data, error } = await supabaseAdmin
      .from('overdue_payment_notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: 결과가 없는 경우
      throw error;
    }
    
    return NextResponse.json({
      data: data as OverduePaymentNoticeResponse | null,
      error: null,
    });
  } catch (error) {
    console.error('최신 연체정보 안내문 조회 오류:', error);
    
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : '최신 연체정보 안내문 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
} 