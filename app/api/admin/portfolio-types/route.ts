import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * 포트폴리오 타입 목록 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 계정 테이블에서 고유한 포트폴리오 타입 목록 가져오기
    const { data, error } = await serviceSupabase
      .from('accounts')
      .select('portfolio_type')
      .order('portfolio_type');
      
    if (error) {
      console.error('포트폴리오 타입 조회 오류:', error);
      return NextResponse.json({ 
        success: false,
        error: '포트폴리오 타입 목록을 조회하는 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }
    
    // 중복 제거
    const uniqueTypes = [...new Set(data.map(item => item.portfolio_type))];
    
    return NextResponse.json({ 
      success: true, 
      data: uniqueTypes
    });
    
  } catch (error) {
    console.error('포트폴리오 타입 목록 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false,
      error: '데이터 조회 중 오류가 발생했습니다.',
      details: (error as Error).message 
    }, { status: 500 });
  }
} 