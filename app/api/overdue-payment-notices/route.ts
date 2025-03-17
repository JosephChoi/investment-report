import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { OverduePaymentNoticeResponse } from '@/lib/overdue-types';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    
    if (!body.content) {
      return NextResponse.json(
        {
          data: null,
          error: '안내문 내용이 필요합니다.',
        },
        { status: 400 }
      );
    }
    
    // 연체정보 안내문 생성 (서비스 역할 키 사용)
    const { data, error } = await supabaseAdmin
      .from('overdue_payment_notices')
      .insert({
        content: body.content,
        // created_by 필드 제거 - 데이터베이스의 기본값 사용
      })
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      data: data as OverduePaymentNoticeResponse,
      error: null,
    });
  } catch (error) {
    console.error('연체정보 안내문 생성 오류:', error);
    
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : '연체정보 안내문 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
} 