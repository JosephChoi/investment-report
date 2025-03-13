import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 현재 로그인한 사용자에게 해당하는 공지사항 조회 (고객용)
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 쿼리 파라미터 가져오기
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // 사용자의 포트폴리오 정보 조회
    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id);
    
    if (portfolioError) {
      return NextResponse.json({ error: portfolioError.message }, { status: 500 });
    }
    
    const portfolioIds = portfolios?.map(portfolio => portfolio.id) || [];
    
    // 사용자에게 해당하는 공지사항 조회
    // 1. 전체 대상 공지사항
    // 2. 사용자의 포트폴리오에 해당하는 공지사항
    const { data, error, count } = await supabase
      .from('announcements')
      .select('*', { count: 'exact' })
      .or(`target_type.eq.all, and(target_type.eq.portfolio, target_portfolios.cs.{${portfolioIds.join(',')}})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data, count });
  } catch (error) {
    console.error('사용자별 공지사항 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 