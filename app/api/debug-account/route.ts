import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 모든 사용자 정보 가져오기
    const { data: users, error: usersError } = await serviceSupabase
      .from('users')
      .select('*')
      .limit(10);
      
    if (usersError) {
      console.error('사용자 정보 조회 오류:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    
    // 모든 계좌 정보 가져오기
    const { data: accounts, error: accountsError } = await serviceSupabase
      .from('accounts')
      .select('*')
      .limit(20);
      
    if (accountsError) {
      console.error('계좌 정보 조회 오류:', accountsError);
      return NextResponse.json({ error: accountsError.message }, { status: 500 });
    }
    
    // 테이블 구조 확인
    const { data: accountColumns, error: columnsError } = await serviceSupabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'accounts');
      
    if (columnsError) {
      console.error('테이블 구조 조회 오류:', columnsError);
    }
    
    return NextResponse.json({
      users: users?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      })),
      accounts,
      accountColumns,
      message: '계좌 정보 디버깅 데이터입니다.'
    });
  } catch (error: any) {
    console.error('디버깅 오류:', error);
    return NextResponse.json(
      { error: error.message || '디버깅 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 