import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { RebalancingHistory } from '@/lib/types';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// 모든 리밸런싱 내역 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/rebalancing-histories: 요청 시작');
    
    // 요청 정보 로깅
    console.log('요청 헤더:', Object.fromEntries([...request.headers.entries()]));
    
    // 1. 인증 토큰 확인 (Bearer 토큰 또는 쿠키 인증)
    let userIdFromAuth = null;
    let userRoleFromAuth = null;
    
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
        
        // 사용자 역할 확인
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', userIdFromAuth)
          .single();
          
        if (!userError && userData) {
          userRoleFromAuth = userData.role;
          console.log('사용자 역할:', userRoleFromAuth);
        } else {
          console.error('사용자 역할 조회 오류:', userError);
        }
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
        
        // 사용자 역할 확인
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', userIdFromAuth)
          .single();
          
        if (!userError && userData) {
          userRoleFromAuth = userData.role;
          console.log('사용자 역할:', userRoleFromAuth);
        } else {
          console.error('사용자 역할 조회 오류:', userError);
        }
      }
    }
    
    // 인증 실패 또는, 인증된 사용자가 없지만 개발 환경에서 테스트 목적으로 요청한 경우 인증을 우회합니다.
    // 실제 프로덕션 환경에서는 이 부분을 제거하거나 엄격하게 제한해야 합니다.
    const isLocalDevelopment = process.env.NODE_ENV === 'development';
    
    if (!userIdFromAuth) {
      if (isLocalDevelopment) {
        console.log('개발 환경에서 테스트 목적으로 인증 우회');
      } else {
        console.error('인증 실패: 인증된 사용자 없음');
        return NextResponse.json(
          { error: '인증되지 않은 요청입니다.' },
          { status: 401 }
        );
      }
    } else if (userRoleFromAuth !== 'admin') {
      console.error('권한 오류: 관리자 권한이 필요합니다.');
      if (!isLocalDevelopment) {
        return NextResponse.json(
          { error: '관리자 권한이 필요합니다.' },
          { status: 403 }
        );
      } else {
        console.log('개발 환경에서 테스트 목적으로 권한 검사 우회');
      }
    }
    
    // 테이블이 있는지 확인
    const { error: tableCheckError } = await supabaseAdmin
      .from('rebalancing_histories')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.error('테이블 체크 오류:', tableCheckError);
      // 테이블이 없는 경우, 빈 배열 반환
      if (tableCheckError.code === '42P01') { // 테이블 없음 에러 코드
        console.log('rebalancing_histories 테이블이 존재하지 않습니다. 빈 배열 반환');
        return NextResponse.json({ data: [] });
      }
    }
    
    // 모든 리밸런싱 내역 가져오기 (관리자용)
    console.log('리밸런싱 내역 조회 시작');
    const { data, error } = await supabaseAdmin
      .from('rebalancing_histories')
      .select(`
        *,
        portfolio_details:portfolio_types(id, name, description)
      `)
      .order('rebalancing_date', { ascending: false });
    
    if (error) {
      console.error('리밸런싱 내역 조회 오류:', error);
      return NextResponse.json(
        { error: '리밸런싱 내역을 가져오는데 실패했습니다: ' + error.message },
        { status: 500 }
      );
    }
    
    console.log(`GET /api/rebalancing-histories: ${data?.length || 0}개의 내역 조회 완료`);
    if (data && data.length > 0) {
      console.log('첫 번째 항목 샘플:', data[0]);
    }
    
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('리밸런싱 내역 API 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류') },
      { status: 500 }
    );
  }
}

// 새로운 리밸런싱 내역 생성
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/rebalancing-histories: 요청 시작');
    
    // 요청 헤더에서 인증 토큰 확인
    const authHeader = request.headers.get('Authorization');
    console.log('인증 헤더 존재:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('인증 헤더가 없거나 올바르지 않습니다.');
      return NextResponse.json(
        { error: '유효한 인증 토큰이 필요합니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }
    
    const tokenFromHeader = authHeader.substring(7);
    console.log('헤더에서 토큰 추출됨 (길이):', tokenFromHeader.length);
    
    // 요청 본문 파싱
    const body = await request.json();
    console.log('요청 본문:', body);
    
    // 필수 필드 확인
    if (!body.portfolio_type_id || !body.rebalancing_date) {
      return NextResponse.json(
        { error: '포트폴리오 ID와 리밸런싱 날짜는 필수 항목입니다.' },
        { status: 400 }
      );
    }
    
    // Supabase 클라이언트 생성 (토큰 인증)
    const supabase = createClient();
    
    // 토큰으로 사용자 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenFromHeader);
    
    console.log('세션 정보:', user ? '사용자 인증됨' : '인증 실패');
    
    if (authError || !user) {
      console.error('사용자 검증 실패:', authError || '사용자 정보 없음');
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    console.log('인증된 사용자 ID:', user.id);
    
    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('사용자 권한 조회 오류:', userError);
      return NextResponse.json(
        { error: '사용자 정보를 가져오는데 실패했습니다: ' + userError.message },
        { status: 500 }
      );
    }
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }
    
    // 리밸런싱 내역 추가
    const newRebalancingHistory = {
      portfolio_type_id: body.portfolio_type_id,
      rebalancing_date: body.rebalancing_date,
      comment: body.comment || '',
      reference_url: body.reference_url || null,
      created_by: user.id
    };
    
    console.log('새로운 리밸런싱 내역:', newRebalancingHistory);
    
    const { data, error } = await supabaseAdmin
      .from('rebalancing_histories')
      .insert(newRebalancingHistory)
      .select();
    
    if (error) {
      console.error('리밸런싱 내역 추가 오류:', error);
      return NextResponse.json(
        { error: '리밸런싱 내역을 추가하는데 실패했습니다: ' + error.message },
        { status: 500 }
      );
    }
    
    console.log('리밸런싱 내역 추가 성공:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('리밸런싱 내역 추가 API 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류') },
      { status: 500 }
    );
  }
} 