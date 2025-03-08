import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * 사용자 계좌 정보 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 이메일 가져오기
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ 
        success: false,
        error: '사용자 이메일이 없습니다.' 
      }, { status: 400 });
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 이메일로 사용자 조회
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id, email, name, phone')
      .eq('email', email)
      .single();
      
    if (userError) {
      console.error('사용자 조회 오류:', userError);
      return NextResponse.json({ 
        success: false,
        error: '해당 이메일의 사용자를 찾을 수 없습니다.' 
      }, { status: 404 });
    }
    
    // 사용자 ID로 계좌 정보 조회
    const { data: accountsData, error: accountsError } = await serviceSupabase
      .from('accounts')
      .select('*')
      .eq('user_id', userData.id);
      
    if (accountsError) {
      console.error('계좌 정보 조회 오류:', accountsError);
      return NextResponse.json({ 
        success: false,
        error: '계좌 정보를 조회하는 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        user: userData,
        accounts: accountsData
      }
    });
    
  } catch (error) {
    console.error('사용자 계좌 정보 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false,
      error: '데이터 조회 중 오류가 발생했습니다.',
      details: (error as Error).message 
    }, { status: 500 });
  }
} 