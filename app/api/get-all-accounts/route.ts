import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 모든 계좌 정보 가져오기 (사용자 정보 포함)
    const { data: accounts, error: accountsError } = await serviceSupabase
      .from('accounts')
      .select(`
        *,
        user:user_id (
          id,
          email,
          name,
          phone
        )
      `);
      
    if (accountsError) {
      console.error('계좌 정보 가져오기 오류:', accountsError);
      return NextResponse.json({ 
        success: false, 
        error: accountsError.message 
      }, { status: 500 });
    }
    
    // 계좌 정보가 없는 경우
    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: '등록된 계좌 정보가 없습니다.' 
      });
    }
    
    return NextResponse.json({
      success: true,
      data: accounts,
      message: '계좌 정보를 성공적으로 가져왔습니다.'
    });
  } catch (error: any) {
    console.error('계좌 정보 가져오기 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || '계좌 정보를 가져오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 