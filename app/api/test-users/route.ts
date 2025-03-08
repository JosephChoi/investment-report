import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 사용자 데이터 가져오기
    const { data: users, error: usersError } = await serviceSupabase
      .from('users')
      .select('*')
      .limit(10);
      
    if (usersError) {
      console.error('사용자 데이터 가져오기 오류:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    
    // 계좌 데이터 가져오기
    const { data: accounts, error: accountsError } = await serviceSupabase
      .from('accounts')
      .select('*')
      .limit(10);
      
    if (accountsError) {
      console.error('계좌 데이터 가져오기 오류:', accountsError);
      return NextResponse.json({ error: accountsError.message }, { status: 500 });
    }
    
    // 잔고 데이터 가져오기
    const { data: balances, error: balancesError } = await serviceSupabase
      .from('balance_records')
      .select('*')
      .limit(10);
      
    if (balancesError) {
      console.error('잔고 데이터 가져오기 오류:', balancesError);
      return NextResponse.json({ error: balancesError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      users,
      accounts,
      balances
    });
  } catch (error: any) {
    console.error('테스트 중 오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '알 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 