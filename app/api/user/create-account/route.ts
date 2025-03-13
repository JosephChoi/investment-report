import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// 사용자 계정 생성 API
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { userId, accountNumber, portfolioTypeId } = body;
    
    console.log('사용자 계정 생성 요청:', { userId, accountNumber, portfolioTypeId });
    
    // 필수 필드 검증
    if (!userId || !accountNumber || !portfolioTypeId) {
      return NextResponse.json({ 
        success: false, 
        error: '사용자 ID, 계좌번호, 포트폴리오 타입 ID가 필요합니다.' 
      }, { status: 400 });
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 포트폴리오 타입 정보 가져오기
    const { data: portfolioType, error: portfolioError } = await serviceSupabase
      .from('portfolio_types')
      .select('id, name')
      .eq('id', portfolioTypeId)
      .single();
      
    if (portfolioError) {
      console.error('포트폴리오 타입 조회 오류:', portfolioError);
      return NextResponse.json({ 
        success: false, 
        error: '포트폴리오 타입을 찾을 수 없습니다.' 
      }, { status: 404 });
    }
    
    // 계정 생성
    const { data: account, error: accountError } = await serviceSupabase
      .from('accounts')
      .insert({
        user_id: userId,
        account_number: accountNumber,
        portfolio_type: portfolioType.name,
        portfolio_type_id: portfolioTypeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (accountError) {
      console.error('계정 생성 오류:', accountError);
      return NextResponse.json({ 
        success: false, 
        error: accountError.message 
      }, { status: 500 });
    }
    
    console.log('계정 생성 성공:', account);
    return NextResponse.json({ 
      success: true, 
      data: account 
    });
    
  } catch (error) {
    console.error('계정 생성 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 