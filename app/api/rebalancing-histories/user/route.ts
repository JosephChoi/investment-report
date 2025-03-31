import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { RebalancingHistory } from '@/lib/types';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// 사용자별 리밸런싱 내역 조회 (현재 사용자가 보유한 포트폴리오에 해당하는 내역만)
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/rebalancing-histories/user: 요청 시작');
    
    // URL에서, 사용자 ID 가져오기
    const userId = request.nextUrl.searchParams.get('userId');
    
    // 사용자 ID가 없으면 오류 응답
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    console.log('사용자 ID:', userId);
    
    // 1. 인증 토큰 확인 (Bearer 토큰 또는 쿠키 인증)
    let userIdFromAuth = null;
    
    // 요청 헤더에서 인증 토큰 확인
    const authHeader = request.headers.get('Authorization');
    console.log('인증 헤더 존재:', authHeader ? '있음' : '없음');
    
    // Supabase 클라이언트 생성
    let supabase;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Bearer 토큰 방식
      const tokenFromHeader = authHeader.substring(7);
      console.log('헤더에서 토큰 추출됨 (길이):', tokenFromHeader.length);
      
      supabase = createClient();
      
      // 토큰으로 사용자 검증
      const { data: { user }, error: authError } = await supabase.auth.getUser(tokenFromHeader);
      
      if (authError || !user) {
        console.error('토큰 인증 실패:', authError || '사용자 정보 없음');
      } else {
        userIdFromAuth = user.id;
        console.log('토큰 인증된 사용자 ID:', userIdFromAuth);
      }
    } else {
      // 쿠키 기반 인증 시도
      const cookieStore = cookies();
      supabase = createClient({ cookies: () => cookieStore });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('쿠키 세션 인증 실패:', sessionError || '세션 없음');
      } else {
        userIdFromAuth = session.user.id;
        console.log('쿠키 인증된 사용자 ID:', userIdFromAuth);
      }
    }
    
    // 인증 실패 또는 요청한 사용자 ID와 인증된 사용자 ID가 다른 경우
    if (!userIdFromAuth || userIdFromAuth !== userId) {
      console.error('인증 실패 또는 사용자 ID 불일치');
      
      // 관리자 권한 확인 (다른 사용자의 정보를 요청하는 경우)
      if (userIdFromAuth) {
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', userIdFromAuth)
          .single();
          
        if (!userError && userData && userData.role === 'admin') {
          console.log('관리자 권한으로 다른 사용자 정보 접근 허용');
        } else {
          return NextResponse.json(
            { error: '인증되지 않은 요청입니다.' },
            { status: 401 }
          );
        }
      } else {
        return NextResponse.json(
          { error: '인증되지 않은 요청입니다.' },
          { status: 401 }
        );
      }
    }
    
    // 현재 시간 기준으로 예정된 리밸런싱(현재 날짜 이후)과 과거 리밸런싱 구분
    const now = new Date().toISOString();
    
    // 포트폴리오 및 리밸런싱 내역 가져오기
    // 1. 사용자의 계정과 연결된 포트폴리오 타입 ID 목록 가져오기
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('portfolio_type_id')
      .eq('user_id', userId);
    
    if (accountsError) {
      console.error('계정 조회 오류:', accountsError);
      return NextResponse.json(
        { error: '계정 정보를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }
    
    // 계정이 없는 경우
    if (!accounts || accounts.length === 0) {
      console.log('사용자의 계정이 없습니다.');
      return NextResponse.json({
        data: {
          current: [],
          past: [],
          all: []
        }
      });
    }
    
    // 포트폴리오 타입 ID 목록
    const portfolioTypeIds = accounts.map((a: { portfolio_type_id: string }) => a.portfolio_type_id).filter(Boolean);
    
    console.log('사용자의 포트폴리오 타입 ID 목록:', portfolioTypeIds);
    
    if (portfolioTypeIds.length === 0) {
      console.log('유효한 포트폴리오 타입 ID가 없습니다.');
      return NextResponse.json({
        data: {
          current: [],
          past: [],
          all: []
        }
      });
    }
    
    // 2. 해당 포트폴리오 타입에 대한 모든 리밸런싱 내역 가져오기
    const { data: rebalancingHistories, error: rebalancingError } = await supabaseAdmin
      .from('rebalancing_histories')
      .select(`
        *,
        portfolio_details:portfolio_types(id, name, description, category, risk_level)
      `)
      .in('portfolio_type_id', portfolioTypeIds)
      .order('rebalancing_date', { ascending: false });
    
    if (rebalancingError) {
      console.error('리밸런싱 내역 조회 오류:', rebalancingError);
      return NextResponse.json(
        { error: '리밸런싱 내역을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }
    
    // 리밸런싱 내역이 없는 경우
    if (!rebalancingHistories || rebalancingHistories.length === 0) {
      console.log('리밸런싱 내역이 없습니다.');
      return NextResponse.json({
        data: {
          current: [],
          past: [],
          all: []
        }
      });
    }
    
    // 현재 날짜 이후와 이전으로 구분
    const current = rebalancingHistories.filter(
      (h: RebalancingHistory) => new Date(h.rebalancing_date) >= new Date(now)
    );
    
    const past = rebalancingHistories.filter(
      (h: RebalancingHistory) => new Date(h.rebalancing_date) < new Date(now)
    );
    
    // 결과 반환
    console.log(`사용자 ${userId}의 리밸런싱 내역 조회 완료: 현재 ${current.length}개, 과거 ${past.length}개`);
    return NextResponse.json({
      data: {
        current,
        past,
        all: rebalancingHistories
      }
    });
  } catch (error) {
    console.error('리밸런싱 내역 API 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 