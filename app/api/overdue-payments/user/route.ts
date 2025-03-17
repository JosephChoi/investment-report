import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { CustomerOverdueInfo } from '@/lib/overdue-types';

export async function GET(request: Request) {
  try {
    // 서버 사이드 Supabase 클라이언트 생성
    const supabase = createClient();
    
    // 현재 로그인한 사용자 정보 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }
    
    // 사용자 정보 가져오기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('사용자 정보 조회 오류:', userError);
      return NextResponse.json(
        { error: '사용자 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }
    
    // 사용자의 계좌 정보 가져오기
    const { data: accountsData, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id);
    
    if (accountsError) {
      console.error('계좌 정보 조회 오류:', accountsError);
      return NextResponse.json(
        { error: '계좌 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
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
    const { data: overdueData, error: overdueError } = await supabase
      .from('overdue_payments')
      .select('*')
      .in('account_number', accountNumbers);
    
    if (overdueError) {
      console.error('연체정보 조회 오류:', overdueError);
      return NextResponse.json(
        { error: '연체정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }
    
    // 최신 안내사항 조회
    const { data: noticeData, error: noticeError } = await supabase
      .from('overdue_payment_notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (noticeError && noticeError.code !== 'PGRST116') {
      // PGRST116는 결과가 없는 경우의 에러 코드
      console.error('안내사항 조회 오류:', noticeError);
    }
    
    // 응답 데이터 구성
    const responseData: CustomerOverdueInfo = {
      hasOverdue: overdueData.length > 0,
      overduePayments: overdueData,
      notice: noticeData || null
    };
    
    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('연체정보 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 