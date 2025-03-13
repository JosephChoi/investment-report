import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// 현재 로그인한 사용자에게 해당하는 공지사항 조회 (고객용)
export async function GET(request: NextRequest) {
  try {
    console.log('사용자용 공지사항 API 호출됨');
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 쿼리 파라미터 가져오기
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      console.error('사용자 ID가 제공되지 않았습니다.');
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
    }
    
    console.log('사용자 ID:', userId);
    
    // 1. 사용자 정보 확인 (role과 관계없이 ID로만 조회)
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('사용자 정보 조회 오류:', userError);
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    console.log('사용자 정보:', userData);
    
    // 2. 사용자의 계정 정보 가져오기 (portfolio_type_id 조회)
    const { data: userAccounts, error: accountsError } = await serviceSupabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
    
    if (accountsError) {
      console.error('사용자 계정 정보 조회 오류:', accountsError);
      return NextResponse.json({ error: accountsError.message }, { status: 500 });
    }
    
    console.log('사용자 계정 정보:', JSON.stringify(userAccounts, null, 2));
    
    // 사용자가 보유한 포트폴리오 타입 ID 목록 추출
    let userPortfolioTypeIds = userAccounts
      ?.map(account => account.portfolio_type_id)
      .filter(Boolean) || [];
    
    console.log('사용자 포트폴리오 타입 ID (portfolio_type_id):', userPortfolioTypeIds);
    
    // 포트폴리오 타입 ID가 없는 경우 대체 방법 시도
    if (userPortfolioTypeIds.length === 0) {
      console.log('portfolio_type_id가 없어 portfolio_type 필드 확인 시도...');
      
      // 포트폴리오 타입 이름으로 ID 조회 시도
      const portfolioTypes = userAccounts
        ?.map(account => account.portfolio_type)
        .filter(Boolean) || [];
      
      if (portfolioTypes.length > 0) {
        console.log('계좌의 portfolio_type 값:', portfolioTypes);
        
        // 포트폴리오 타입 이름으로 ID 조회
        const { data: portfolioTypeData, error: portfolioTypeError } = await serviceSupabase
          .from('portfolio_types')
          .select('id, name')
          .in('name', portfolioTypes);
        
        if (!portfolioTypeError && portfolioTypeData && portfolioTypeData.length > 0) {
          console.log('포트폴리오 타입 데이터:', portfolioTypeData);
          
          // 포트폴리오 타입 ID 추출
          const portfolioTypeIds = portfolioTypeData.map(pt => pt.id);
          userPortfolioTypeIds.push(...portfolioTypeIds);
          
          console.log('대체 방법으로 찾은 포트폴리오 타입 ID:', userPortfolioTypeIds);
          
          // 계정 정보 업데이트
          for (const account of userAccounts) {
            if (!account.portfolio_type_id && account.portfolio_type) {
              const matchingPortfolioType = portfolioTypeData.find(pt => pt.name === account.portfolio_type);
              if (matchingPortfolioType) {
                console.log(`계정 ${account.id}의 portfolio_type_id 업데이트: ${matchingPortfolioType.id}`);
                
                const { error: updateError } = await serviceSupabase
                  .from('accounts')
                  .update({ portfolio_type_id: matchingPortfolioType.id })
                  .eq('id', account.id);
                
                if (updateError) {
                  console.error('계정 업데이트 오류:', updateError);
                } else {
                  console.log(`계정 ${account.id} 업데이트 성공`);
                }
              }
            }
          }
        } else {
          console.error('포트폴리오 타입 조회 오류:', portfolioTypeError);
        }
      }
    }
    
    // 3. 모든 공지사항 가져오기
    let allAnnouncements = [];
    
    // 3.1 전체 공지사항 가져오기
    const { data: allTargetAnnouncements, error: allTargetError } = await serviceSupabase
      .from('announcements')
      .select('*')
      .eq('target_type', 'all')
      .order('created_at', { ascending: false });
    
    if (allTargetError) {
      console.error('전체 공지사항 조회 오류:', allTargetError);
      return NextResponse.json({ error: allTargetError.message }, { status: 500 });
    }
    
    console.log(`${allTargetAnnouncements?.length || 0}개의 전체 공지사항을 조회했습니다.`);
    if (allTargetAnnouncements && allTargetAnnouncements.length > 0) {
      console.log('전체 공지사항 예시:', {
        id: allTargetAnnouncements[0].id,
        title: allTargetAnnouncements[0].title,
        target_type: allTargetAnnouncements[0].target_type
      });
    }
    
    allAnnouncements = [...(allTargetAnnouncements || [])];
    
    // 3.2 포트폴리오 대상 공지사항 가져오기 (사용자 포트폴리오 유무와 관계없이 모두 가져옴)
    const { data: portfolioAnnouncements, error: portfolioError } = await serviceSupabase
      .from('announcements')
      .select('*')
      .eq('target_type', 'portfolio')
      .order('created_at', { ascending: false });
    
    if (portfolioError) {
      console.error('포트폴리오 공지사항 조회 오류:', portfolioError);
      return NextResponse.json({ error: portfolioError.message }, { status: 500 });
    }
    
    console.log(`${portfolioAnnouncements?.length || 0}개의 포트폴리오 공지사항을 조회했습니다.`);
    
    // 디버깅: 모든 포트폴리오 공지사항 로그 출력
    if (portfolioAnnouncements && portfolioAnnouncements.length > 0) {
      console.log('포트폴리오 공지사항 예시:', {
        id: portfolioAnnouncements[0].id,
        title: portfolioAnnouncements[0].title,
        target_type: portfolioAnnouncements[0].target_type
      });
      console.log('포트폴리오 공지사항 예시의 target_portfolios:', 
        JSON.stringify(portfolioAnnouncements[0].target_portfolios, null, 2));
      
      console.log('디버깅: 모든 포트폴리오 공지사항 정보');
      portfolioAnnouncements.forEach((announcement, index) => {
        console.log(`디버깅: 포트폴리오 공지사항 ${index + 1}:`, {
          id: announcement.id,
          title: announcement.title,
          target_portfolios: announcement.target_portfolios
        });
      });
      
      // 사용자가 보유한 포트폴리오가 있는 경우
      if (userPortfolioTypeIds.length > 0) {
        console.log('사용자 포트폴리오 타입 ID가 있습니다. 필터링을 시작합니다.');
        
        // 사용자의 포트폴리오에 해당하는 공지사항만 필터링
        const filteredPortfolioAnnouncements = portfolioAnnouncements.filter(announcement => {
          // 공지사항의 target_portfolios가 배열이 아니면 건너뛰기
          if (!Array.isArray(announcement.target_portfolios)) {
            console.log(`공지사항 ID ${announcement.id}의 target_portfolios가 배열이 아닙니다:`, announcement.target_portfolios);
            return false;
          }
          
          // 공지사항의 target_portfolios가 비어있으면 건너뛰기
          if (announcement.target_portfolios.length === 0) {
            console.log(`공지사항 ID ${announcement.id}의 target_portfolios가 비어있습니다.`);
            return false;
          }
          
          // 사용자의 포트폴리오 ID 중 하나라도 공지사항의 target_portfolios에 포함되어 있으면 true 반환
          const hasMatchingPortfolio = userPortfolioTypeIds.some(userPortfolioId => {
            // UUID 문자열 비교를 위해 모든 값을 문자열로 변환하여 비교
            const matches = announcement.target_portfolios.some((targetPortfolio: any) => {
              const userIdStr = String(userPortfolioId).toLowerCase().trim();
              const targetIdStr = String(targetPortfolio).toLowerCase().trim();
              const isMatch = userIdStr === targetIdStr;
              
              console.log(`비교: 사용자 ID ${userIdStr} vs 타겟 ID ${targetIdStr} => ${isMatch ? '일치' : '불일치'}`);
              
              return isMatch;
            });
            
            return matches;
          });
          
          if (hasMatchingPortfolio) {
            console.log(`공지사항 ID ${announcement.id}는 사용자의 포트폴리오에 해당합니다.`);
          } else {
            console.log(`공지사항 ID ${announcement.id}는 사용자의 포트폴리오에 해당하지 않습니다.`);
            console.log('공지사항 target_portfolios:', announcement.target_portfolios);
            console.log('사용자 포트폴리오 ID:', userPortfolioTypeIds);
          }
          
          return hasMatchingPortfolio;
        });
        
        console.log(`${filteredPortfolioAnnouncements.length}개의 포트폴리오 공지사항이 사용자에게 해당합니다.`);
        
        // 필터링된 포트폴리오 공지사항을 전체 공지사항에 추가
        allAnnouncements = [...allAnnouncements, ...filteredPortfolioAnnouncements];
      } else {
        console.log('사용자가 보유한 포트폴리오가 없어 전체 공지사항만 표시합니다.');
      }
    } else {
      console.log('포트폴리오 공지사항이 없습니다.');
    }
    
    // 4. 공지사항을 생성일 기준으로 내림차순 정렬
    allAnnouncements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // 중요도 필드가 없는 공지사항에 기본값 설정
    const processedAnnouncements = allAnnouncements.map(announcement => {
      if (announcement.importance_level === undefined || announcement.importance_level === null) {
        return { ...announcement, importance_level: 3 }; // 기본값: 보통
      }
      return announcement;
    });
    
    console.log(`${processedAnnouncements.length}개의 공지사항을 반환합니다.`);
    return NextResponse.json({ 
      data: processedAnnouncements
    });
  } catch (error) {
    console.error('사용자별 공지사항 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 