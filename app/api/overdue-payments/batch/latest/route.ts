import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // 가장 최근 배치 ID 조회 (인증 검사 없이 관리자 권한으로 직접 조회)
    const { data, error } = await supabaseAdmin
      .from('overdue_payments')
      .select('batch_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: 결과가 없는 경우
      throw error;
    }
    
    // 결과가 없는 경우 다른 방법으로 시도
    if (!data) {
      // 모든 배치 ID 중 가장 최근 것 조회
      const { data: allBatchData, error: allBatchError } = await supabaseAdmin
        .from('overdue_payments')
        .select('batch_id')
        .order('batch_id', { ascending: false })
        .limit(1)
        .single();
        
      if (allBatchError && allBatchError.code !== 'PGRST116') {
        throw allBatchError;
      }
      
      const response = NextResponse.json({
        success: true,
        data: allBatchData ? { batchId: allBatchData.batch_id } : null,
      });
      
      // 캐시 제어 헤더 추가
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    }
    
    const response = NextResponse.json({
      success: true,
      data: { batchId: data.batch_id },
    });
    
    // 캐시 제어 헤더 추가
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('최신 배치 ID 조회 오류:', error);
    
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '최신 배치 ID 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
    
    // 캐시 제어 헤더 추가
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }
} 