import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { CustomerOverdueInfo } from '@/lib/overdue-types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 현재 로그인한 사용자 정보 가져오기
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        {
          data: null,
          error: '인증되지 않은 사용자입니다.',
        },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // 사용자의 계좌 정보 가져오기
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('account_number')
      .eq('customer_id', userId);
    
    if (accountsError) {
      throw accountsError;
    }
    
    // 계좌가 없는 경우
    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        data: {
          hasOverdue: false,
          overduePayments: [],
          notice: null,
        } as CustomerOverdueInfo,
        error: null,
      });
    }
    
    // 계좌번호 목록
    const accountNumbers = accounts.map((account) => account.account_number);
    
    // 연체정보 가져오기
    const { data: overduePayments, error: overdueError } = await supabase
      .from('overdue_payments')
      .select('*')
      .in('account_number', accountNumbers);
    
    if (overdueError) {
      throw overdueError;
    }
    
    // 최신 안내사항 가져오기
    const { data: notices, error: noticeError } = await supabase
      .from('overdue_payment_notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (noticeError) {
      throw noticeError;
    }
    
    const response: CustomerOverdueInfo = {
      hasOverdue: overduePayments && overduePayments.length > 0,
      overduePayments: overduePayments || [],
      notice: notices && notices.length > 0 ? notices[0] : null,
    };
    
    return NextResponse.json({
      data: response,
      error: null,
    });
  } catch (error) {
    console.error('고객 연체정보 조회 오류:', error);
    
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : '연체정보 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
} 