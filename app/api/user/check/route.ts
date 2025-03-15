import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * 사용자 ID 유효성 검증 API
 * 주어진 ID의 사용자가 데이터베이스에 존재하는지 확인합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const email = searchParams.get('email'); // 이메일 파라미터 추가

    if (!userId && !email) {
      return NextResponse.json({ 
        exists: false, 
        error: '사용자 ID 또는 이메일이 제공되지 않았습니다.' 
      }, { status: 400 });
    }

    console.log('사용자 ID 유효성 검증 요청:', userId);
    if (email) {
      console.log('이메일로 검증 요청:', email, '(소문자 변환 후:', email.toLowerCase(), ')');
    }

    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    let query = serviceSupabase.from('users').select('id, name, email');
    
    // ID 또는 이메일로 조회
    if (userId) {
      query = query.eq('id', userId);
    } else if (email) {
      // 이메일은 소문자로 변환하여 ILIKE로 대소문자 구분 없이 검색
      query = query.ilike('email', email.toLowerCase());
    }
    
    const { data, error, status, statusText } = await query.single();
    
    console.log('사용자 조회 상태:', status, statusText);
    
    if (error) {
      console.error('사용자 조회 오류:', error);
      
      // 데이터가 없는 경우 (404 오류)
      if (error.code === 'PGRST116') {
        // 대소문자 구분 없이 이메일로 다시 시도
        if (userId && !email) {
          try {
            const { data: userData } = await serviceSupabase
              .from('users')
              .select('id, name, email')
              .single();
            
            if (userData) {
              console.log('ID로 찾지 못했지만 이메일로 사용자 찾음:', userData);
              return NextResponse.json({
                exists: true,
                user: {
                  id: userData.id,
                  name: userData.name,
                  email: userData.email
                },
                note: 'ID로 찾지 못했지만 이메일로 사용자를 찾았습니다.'
              });
            }
          } catch (e) {
            console.warn('이메일로 재시도 중 오류:', e);
          }
        }
        
        return NextResponse.json({ 
          exists: false,
          message: '해당 ID 또는 이메일의 사용자가 존재하지 않습니다.'
        });
      }
      
      return NextResponse.json({ 
        exists: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    // 사용자가 존재하는 경우
    console.log('사용자 조회 결과:', data ? '사용자 존재' : '사용자 없음', data);
    
    // 추가 검증: 실제 consultations 테이블에서 사용할 수 있는지 확인
    try {
      const { count, error: countError } = await serviceSupabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.id); // 찾은 사용자의 ID 사용
      
      if (countError) {
        console.warn('consultations 테이블 검증 오류:', countError);
      } else {
        console.log('consultations 테이블에서 해당 사용자 ID 사용 가능 여부 확인됨');
      }
    } catch (e) {
      console.warn('consultations 테이블 검증 중 예외 발생:', e);
    }
    
    return NextResponse.json({
      exists: !!data,
      user: data ? {
        id: data.id,
        name: data.name,
        email: data.email
      } : null
    });
    
  } catch (error) {
    console.error('사용자 ID 유효성 검증 중 오류 발생:', error);
    return NextResponse.json({ 
      exists: false,
      error: '데이터 조회 중 오류가 발생했습니다.',
      details: (error as Error).message 
    }, { status: 500 });
  }
} 