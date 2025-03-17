import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { paymentIds } = body;
    
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      const response = NextResponse.json(
        {
          success: false,
          error: '삭제할 연체정보 ID가 제공되지 않았습니다.',
        },
        { status: 400 }
      );
      
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    }
    
    // 연체정보 삭제
    const { error } = await supabaseAdmin
      .from('overdue_payments')
      .delete()
      .in('id', paymentIds);
    
    if (error) {
      throw error;
    }
    
    const response = NextResponse.json({
      success: true,
      message: `${paymentIds.length}개의 연체정보가 성공적으로 삭제되었습니다.`,
    });
    
    // 캐시 제어 헤더 추가
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('연체정보 삭제 오류:', error);
    
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '연체정보 삭제 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
    
    // 캐시 제어 헤더 추가
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }
} 