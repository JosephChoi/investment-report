import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { OverduePaymentNoticeResponse } from '@/lib/overdue-types';

export async function GET(request: NextRequest) {
  try {
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