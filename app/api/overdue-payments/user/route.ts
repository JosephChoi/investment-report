import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CustomerOverdueInfo } from '@/lib/overdue-types';

export async function GET(request: NextRequest) {
  try {
    // URL에서 사용자 ID 가져오기
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // 사용자 ID가 없는 경우 빈 결과 반환
    if (!userId) {
      console.log('사용자 ID가 제공되지 않았습니다.');
      const emptyResult: CustomerOverdueInfo = {
        hasOverdue: false,
        overduePayments: [],
        notice: null
      };
      
      return NextResponse.json({ data: emptyResult });
    }
    
    // 사용자 정보 가져오기
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('사용자 정보 조회 오류:', userError);
      // 사용자 정보 오류가 발생해도 빈 결과 반환
      const emptyResult: CustomerOverdueInfo = {
        hasOverdue: false,
        overduePayments: [],
        notice: null
      };
      
      return NextResponse.json({ data: emptyResult });
    }
    
    // 동일 전화번호/이름을 가진 모든 사용자 ID 찾기 (고객 일원화)
    let allUserIds = [userId]; // 기본적으로 현재 사용자 ID 포함
    
    // 전화번호와 이름이 모두 있는 경우만 관련 사용자 검색
    if (userData?.phone && userData?.name) {
      const { data: relatedUsers, error: relatedUsersError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', userData.phone)
        .eq('name', userData.name);
        
      if (!relatedUsersError && relatedUsers && relatedUsers.length > 0) {
        // 중복 없이 모든 관련 사용자 ID 추가
        const relatedUserIds = relatedUsers.map(u => u.id);
        console.log('전화번호/이름이 일치하는 관련 사용자 ID:', relatedUserIds);
        
        // 중복 제거 (Set 사용)
        allUserIds = [...new Set([...allUserIds, ...relatedUserIds])];
      }
    }
    
    console.log('처리할 모든 사용자 ID 목록:', allUserIds);

    // 모든 관련 사용자의 계좌 정보 가져오기
    const { data: accountsData, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .in('user_id', allUserIds);
    
    if (accountsError) {
      console.error('계좌 정보 조회 오류:', accountsError);
      // 계좌 정보 오류가 발생해도 빈 결과 반환
      const emptyResult: CustomerOverdueInfo = {
        hasOverdue: false,
        overduePayments: [],
        notice: null
      };
      
      return NextResponse.json({ data: emptyResult });
    }
    
    // 계좌 번호 목록 추출
    const accountNumbers = accountsData.map((account: any) => account.account_number);
    
    if (accountNumbers.length === 0) {
      // 계좌가 없는 경우 빈 결과 반환
      const emptyResult: CustomerOverdueInfo = {
        hasOverdue: false,
        overduePayments: [],
        notice: null
      };
      
      return NextResponse.json({ data: emptyResult });
    }
    
    // 연체정보 조회
    const { data: overdueData, error: overdueError } = await supabaseAdmin
      .from('overdue_payments')
      .select('*')
      .in('account_number', accountNumbers);
    
    if (overdueError) {
      console.error('연체정보 조회 오류:', overdueError);
      // 연체정보 오류가 발생해도 빈 결과 반환
      const emptyResult: CustomerOverdueInfo = {
        hasOverdue: false,
        overduePayments: [],
        notice: null
      };
      
      return NextResponse.json({ data: emptyResult });
    }
    
    // 응답 데이터 구성
    const responseData: CustomerOverdueInfo = {
      hasOverdue: overdueData.length > 0,
      overduePayments: overdueData,
      notice: null
    };
    
    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('연체정보 API 오류:', error);
    // 예외 발생 시에도 빈 결과 반환
    const emptyResult: CustomerOverdueInfo = {
      hasOverdue: false,
      overduePayments: [],
      notice: null
    };
    
    return NextResponse.json({ data: emptyResult });
  }
} 