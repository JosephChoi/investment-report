import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// 사용자 계정 삭제 API
export async function DELETE(request: NextRequest) {
  try {
    // 쿼리 파라미터 가져오기
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    
    console.log('계정 삭제 요청:', { accountId });
    
    // 필수 필드 검증
    if (!accountId) {
      return NextResponse.json({ 
        success: false, 
        error: '계정 ID가 필요합니다.' 
      }, { status: 400 });
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 계정 삭제
    const { error: deleteError } = await serviceSupabase
      .from('accounts')
      .delete()
      .eq('id', accountId);
      
    if (deleteError) {
      console.error('계정 삭제 오류:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: deleteError.message 
      }, { status: 500 });
    }
    
    console.log('계정 삭제 성공:', accountId);
    return NextResponse.json({ 
      success: true, 
      message: '계정이 성공적으로 삭제되었습니다.' 
    });
    
  } catch (error) {
    console.error('계정 삭제 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 