import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // 최신 안내사항 조회 (인증 검사 없이 관리자 권한으로 직접 조회)
    const { data, error } = await supabaseAdmin
      .from('overdue_payment_notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: 결과가 없는 경우
      throw error;
    }
    
    const response = NextResponse.json({
      data: data || null,
      error: null,
    });
    
    // 캐시 제어 헤더 추가
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('최신 안내사항 조회 오류:', error);
    
    const response = NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : '최신 안내사항 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
    
    // 캐시 제어 헤더 추가
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }
} 