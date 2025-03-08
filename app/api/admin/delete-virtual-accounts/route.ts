import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 가상 계좌 정보 삭제
    const { data, error } = await serviceSupabase
      .from('accounts')
      .delete()
      .in('account_number', ['123-456-789', '987-654-321']);
      
    if (error) {
      console.error('가상 계좌 삭제 오류:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '가상 계좌 정보가 성공적으로 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('가상 계좌 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || '가상 계좌 삭제 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 