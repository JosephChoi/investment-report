import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * 사용자 정보 조회 API
 * 사용자 ID를 받아 데이터베이스에서 해당 사용자의 정보를 조회합니다.
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 사용자 ID 가져오기
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: '사용자 ID가 필요합니다.' 
      }, { status: 400 });
    }
    
    console.log('사용자 정보 조회 요청:', userId);
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 사용자 ID로 사용자 조회
    const { data, error } = await serviceSupabase
      .from('users')
      .select('id, email, name, phone, role, created_at')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('사용자 조회 오류:', error);
      return NextResponse.json({ 
        success: false,
        error: '해당 ID의 사용자를 찾을 수 없습니다.' 
      }, { status: 404 });
    }
    
    console.log('사용자 정보 조회 결과:', data);
    
    return NextResponse.json({ 
      success: true,
      data
    });
    
  } catch (error) {
    console.error('사용자 정보 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false,
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 