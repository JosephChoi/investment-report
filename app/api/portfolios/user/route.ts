import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// 사용자별 포트폴리오 조회
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/portfolios/user: 요청 시작');
    
    // URL에서 사용자 ID 가져오기
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
    
    // 2. 사용자의 계정과 연결된 포트폴리오 타입 ID 목록 가져오기
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
      return NextResponse.json({ data: [] });
    }
    
    // 포트폴리오 타입 ID 목록
    const portfolioTypeIds = accounts
      .map((a: { portfolio_type_id: string }) => a.portfolio_type_id)
      .filter(Boolean);
    
    console.log('사용자의 포트폴리오 타입 ID 목록:', portfolioTypeIds);
    
    if (portfolioTypeIds.length === 0) {
      console.log('유효한 포트폴리오 타입 ID가 없습니다.');
      return NextResponse.json({ data: [] });
    }
    
    // 3. 해당 포트폴리오 타입 정보 가져오기
    const { data: portfolios, error: portfoliosError } = await supabaseAdmin
      .from('portfolio_types')
      .select('id, name, description, category, risk_level')
      .in('id', portfolioTypeIds);
    
    if (portfoliosError) {
      console.error('포트폴리오 조회 오류:', portfoliosError);
      return NextResponse.json(
        { error: '포트폴리오 정보를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }
    
    // 결과 반환
    console.log(`사용자 ${userId}의 포트폴리오 ${portfolios?.length || 0}개 조회 완료`);
    return NextResponse.json({ data: portfolios || [] });
  } catch (error) {
    console.error('포트폴리오 API 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 