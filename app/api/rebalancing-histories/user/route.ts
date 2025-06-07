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
    
    // 1. 인증 확인 (쿠키 우선, Bearer 토큰 보조)
    let userIdFromAuth = null;
    let supabase;
    
    // 먼저 쿠키 기반 인증 시도
    const cookieStore = cookies();
    supabase = createClient({ cookies: () => cookieStore });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!sessionError && session?.user) {
      userIdFromAuth = session.user.id;
      console.log('쿠키 인증된 사용자 ID:', userIdFromAuth);
    } else {
      console.log('쿠키 세션 인증 실패, Bearer 토큰 확인 시도');
      
      // 쿠키 인증 실패 시 Bearer 토큰 확인
      const authHeader = request.headers.get('Authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const tokenFromHeader = authHeader.substring(7);
        console.log('헤더에서 토큰 추출됨 (길이):', tokenFromHeader.length);
        
        supabase = createClient();
        
        // 토큰으로 사용자 검증
        const { data: { user }, error: authError } = await supabase.auth.getUser(tokenFromHeader);
        
        if (!authError && user) {
          userIdFromAuth = user.id;
          console.log('토큰 인증된 사용자 ID:', userIdFromAuth);
        } else {
          console.error('토큰 인증 실패:', authError || '사용자 정보 없음');
        }
      }
    }
    
    // 인증 실패 또는 요청한 사용자 ID와 인증된 사용자 ID가 다른 경우
    if (!userIdFromAuth || userIdFromAuth !== userId) {
      console.error('인증 실패 또는 사용자 ID 불일치');
      
      // 개발 환경에서는 임시적으로 인증 우회
      const isLocalDevelopment = process.env.NODE_ENV === 'development';
      
      if (isLocalDevelopment) {
        console.log('개발 환경에서 인증 우회 - 직접 supabaseAdmin 사용');
        // 개발 환경에서는 supabaseAdmin을 사용하여 데이터 조회
        return await handleWithAdminAccess(userId);
      }
      
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
    
    // 포트폴리오 및 리밸런싱 내역 가져오기
    // 1. 사용자 정보 조회 (전화번호, 이름 확인) - Admin 권한 사용
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, name, phone')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('사용자 정보 조회 오류:', userError);
      return NextResponse.json(
        { error: '사용자 정보를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }
    
    console.log('현재 사용자 정보:', currentUser);
    
    // 2. 동일 전화번호/이름을 가진 모든 사용자 ID 찾기 (고객 일원화) - Admin 권한 필요
    let allUserIds = [userId]; // 기본적으로 현재 사용자 ID 포함
    
    // 전화번호와 이름이 모두 있는 경우만 관련 사용자 검색
    if (currentUser?.phone && currentUser?.name) {
      const { data: relatedUsers, error: relatedUsersError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', currentUser.phone)
        .eq('name', currentUser.name);
        
      if (!relatedUsersError && relatedUsers && relatedUsers.length > 0) {
        // 중복 없이 모든 관련 사용자 ID 추가
        const relatedUserIds = relatedUsers.map(u => u.id);
        console.log('전화번호/이름이 일치하는 관련 사용자 ID:', relatedUserIds);
        
        // 중복 제거 (Set 사용)
        allUserIds = [...new Set([...allUserIds, ...relatedUserIds])];
      }
    }
    
    console.log('처리할 모든 사용자 ID 목록:', allUserIds);
    
    // 3. 모든 관련 사용자의 계정 조회 - 관리자 권한 사용 (통합 계정 조회를 위해)
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('portfolio_type_id')
      .in('user_id', allUserIds);
    
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
    
    // 2. 해당 포트폴리오 타입에 대한 모든 리밸런싱 내역 가져오기 - 관리자 권한 사용
    const { data: rebalancingHistories, error: rebalancingError } = await supabaseAdmin
      .from('rebalancing_histories')
      .select(`
        *,
        portfolio_details:portfolio_types(id, name, description)
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
    
    // 원본 데이터 로깅
    console.log('데이터베이스에서 가져온 모든 리밸런싱 내역:', 
      rebalancingHistories?.map(h => ({
        id: h.id,
        date: h.rebalancing_date,
        portfolio_type_id: h.portfolio_type_id
      }))
    );
    
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
    const now = new Date();
    console.log('현재 날짜 객체:', now);
    
    // 현재 날짜를 YYYY-MM-DD 형식의 문자열로 변환
    const nowStr = now.toISOString().split('T')[0];
    console.log('현재 날짜 문자열:', nowStr);
    
    const current = rebalancingHistories.filter((h: RebalancingHistory) => {
      // 날짜를 YYYY-MM-DD 형식으로 추출
      const dateStr = h.rebalancing_date.split('T')[0];
      console.log(`비교: ${dateStr} >= ${nowStr} = ${dateStr >= nowStr}`);
      return dateStr >= nowStr;
    });
    
    const past = rebalancingHistories.filter((h: RebalancingHistory) => {
      // 날짜를 YYYY-MM-DD 형식으로 추출
      const dateStr = h.rebalancing_date.split('T')[0];
      console.log(`비교: ${dateStr} < ${nowStr} = ${dateStr < nowStr}`);
      return dateStr < nowStr;
    });
    
    // 과거 내역 로깅
    console.log('API에서 필터링된 과거 리밸런싱 내역:', 
      past.map(h => ({
        id: h.id,
        date: h.rebalancing_date,
        portfolio_type_id: h.portfolio_type_id
      }))
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

// 관리자 권한으로 데이터 조회하는 함수
async function handleWithAdminAccess(userId: string) {
  try {
    // 1. 사용자 정보 조회 (전화번호, 이름 확인)
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, name, phone')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('사용자 정보 조회 오류:', userError);
      return NextResponse.json(
        { error: '사용자 정보를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }
    
    console.log('현재 사용자 정보:', currentUser);
    
    // 2. 동일 전화번호/이름을 가진 모든 사용자 ID 찾기 (고객 일원화)
    let allUserIds = [userId]; // 기본적으로 현재 사용자 ID 포함
    
    // 전화번호와 이름이 모두 있는 경우만 관련 사용자 검색
    if (currentUser?.phone && currentUser?.name) {
      const { data: relatedUsers, error: relatedUsersError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', currentUser.phone)
        .eq('name', currentUser.name);
        
      if (!relatedUsersError && relatedUsers && relatedUsers.length > 0) {
        // 중복 없이 모든 관련 사용자 ID 추가
        const relatedUserIds = relatedUsers.map(u => u.id);
        console.log('전화번호/이름이 일치하는 관련 사용자 ID:', relatedUserIds);
        
        // 중복 제거 (Set 사용)
        allUserIds = [...new Set([...allUserIds, ...relatedUserIds])];
      }
    }
    
    console.log('처리할 모든 사용자 ID 목록:', allUserIds);
    
    // 3. 모든 관련 사용자의 계정 조회
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('portfolio_type_id')
      .in('user_id', allUserIds);
    
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
    
    // 4. 해당 포트폴리오 타입에 대한 모든 리밸런싱 내역 가져오기
    const { data: rebalancingHistories, error: rebalancingError } = await supabaseAdmin
      .from('rebalancing_histories')
      .select(`
        *,
        portfolio_details:portfolio_types(id, name, description)
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
    
    // 원본 데이터 로깅
    console.log('데이터베이스에서 가져온 모든 리밸런싱 내역:', 
      rebalancingHistories?.map(h => ({
        id: h.id,
        date: h.rebalancing_date,
        portfolio_type_id: h.portfolio_type_id
      }))
    );
    
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
    const now = new Date();
    console.log('현재 날짜 객체:', now);
    
    // 현재 날짜를 YYYY-MM-DD 형식의 문자열로 변환
    const nowStr = now.toISOString().split('T')[0];
    console.log('현재 날짜 문자열:', nowStr);
    
    const current = rebalancingHistories.filter((h: any) => {
      // 날짜를 YYYY-MM-DD 형식으로 추출
      const dateStr = h.rebalancing_date.split('T')[0];
      console.log(`비교: ${dateStr} >= ${nowStr} = ${dateStr >= nowStr}`);
      return dateStr >= nowStr;
    });
    
    const past = rebalancingHistories.filter((h: any) => {
      // 날짜를 YYYY-MM-DD 형식으로 추출
      const dateStr = h.rebalancing_date.split('T')[0];
      console.log(`비교: ${dateStr} < ${nowStr} = ${dateStr < nowStr}`);
      return dateStr < nowStr;
    });
    
    // 과거 내역 로깅
    console.log('API에서 필터링된 과거 리밸런싱 내역:', 
      past.map(h => ({
        id: h.id,
        date: h.rebalancing_date,
        portfolio_type_id: h.portfolio_type_id
      }))
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
    console.error('관리자 권한 리밸런싱 내역 API 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 