import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { OverduePayment } from '@/lib/overdue-types';

export async function GET(request: NextRequest) {
  try {
    // URL 파라미터 파싱
    const url = new URL(request.url);
    const batchId = url.searchParams.get('batch_id');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;
    
    // 쿼리 빌드 (서비스 역할 키 사용)
    let query = supabaseAdmin
      .from('overdue_payments')
      .select('*', { count: 'exact' });
    
    if (batchId) {
      query = query.eq('batch_id', batchId);
    }
    
    if (search) {
      query = query.or(
        `account_name.ilike.%${search}%,account_number.ilike.%${search}%,overdue_status.ilike.%${search}%,mp_name.ilike.%${search}%`
      );
    }
    
    // 페이지네이션 적용
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return NextResponse.json({
      data: data as OverduePayment[],
      meta: {
        currentPage: page,
        totalPages,
        totalCount: count,
      },
      error: null,
    });
  } catch (error) {
    console.error('연체정보 조회 오류:', error);
    
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : '연체정보 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
} 