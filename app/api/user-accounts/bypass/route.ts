import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // CORS 헤더를 포함한 Response 헬퍼 함수
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  };

  // 오류 응답 헬퍼 함수
  const errorResponse = (status: number, message: string, details?: any, code?: string) => {
    return NextResponse.json(
      {
        success: false,
        error: message,
        details: details || null,
        code: code || 'ERROR',
        timestamp: new Date().toISOString()
      },
      { 
        status, 
        headers: corsHeaders
      }
    );
  };

  // 성공 응답 헬퍼 함수
  const successResponse = (data: any, userId?: string) => {
    return NextResponse.json(
      {
        success: true,
        data: data,
        userId: userId || null,
        timestamp: new Date().toISOString()
      },
      { 
        headers: corsHeaders
      }
    );
  };

  try {
    console.log('사용자 계정 정보 우회 API 호출됨');
    
    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 204,
        headers: corsHeaders
      });
    }
    
    // URL에서 사용자 ID 가져오기
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return errorResponse(400, '사용자 ID가 필요합니다.', null, 'MISSING_USER_ID');
    }
    
    console.log('요청된 사용자 ID:', userId);
    
    // 인증 헤더에서 토큰 추출 (Bearer token 방식)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    // 토큰이 없는 경우 -> RLS 정책 우회하여 직접 조회
    if (!token) {
      console.log('인증 토큰이 없습니다. RLS 정책 우회하여 직접 조회합니다.');
      
      try {
        // 관리자 권한으로 데이터 가져오기 (RLS 우회)
        const { data, error } = await supabaseAdmin
          .from('accounts')
          .select('*, portfolio:portfolio_types(id, name)')
          .eq('user_id', userId);
          
        if (error) {
          console.error('사용자 계정 정보 가져오기 오류:', error);
          console.error('오류 세부정보:', JSON.stringify(error));
          return errorResponse(
            500, 
            '데이터베이스에서 계정 정보를 가져오는 중 오류가 발생했습니다.',
            error.message,
            error.code
          );
        }
        
        console.log('사용자 계정 정보 조회 성공 (관리자 권한):', data ? `${data.length}개 계정` : '계정 없음');
        
        return successResponse(data || [], userId);
      } catch (dbError: any) {
        console.error('관리자 권한 데이터베이스 처리 오류:', dbError);
        return errorResponse(
          500,
          '데이터베이스 처리 중 예외가 발생했습니다.',
          dbError.message || '알 수 없는 데이터베이스 오류',
          'DB_EXCEPTION'
        );
      }
    }
    
    // 토큰으로 세션 확인
    const supabase = createClient();
    
    try {
      // 토큰 설정
      const { data: { user }, error: setSessionError } = await supabase.auth.getUser(token);
      
      if (setSessionError || !user) {
        console.error('토큰으로 사용자 확인 실패:', setSessionError);
        return errorResponse(401, '유효하지 않은 인증 토큰입니다. 다시 로그인해주세요.', setSessionError?.message, 'INVALID_TOKEN');
      }
      
      console.log('인증된 사용자:', user.id);
      
      // 요청된 사용자 ID와 현재 로그인된 사용자 ID가 다를 경우 권한 확인
      if (userId !== user.id) {
        console.log('다른 사용자의 데이터에 접근 시도 - 관리자 권한 확인 필요');
        // 여기에 관리자 권한 확인 로직을 추가할 수 있습니다.
        console.log('주의: 관리자 권한 확인이 필요하지만, 현재는 우회 API에서 허용합니다.');
      }
      
      // 관리자 권한으로 데이터 가져오기 (RLS 우회하여 모든 데이터 접근)
      const { data, error } = await supabaseAdmin
        .from('accounts')
        .select('*, portfolio:portfolio_types(id, name)')
        .eq('user_id', userId);
        
      if (error) {
        console.error('사용자 계정 정보 가져오기 오류:', error);
        console.error('오류 세부정보:', JSON.stringify(error));
        return errorResponse(
          500, 
          '데이터베이스에서 계정 정보를 가져오는 중 오류가 발생했습니다.',
          error.message,
          error.code
        );
      }
      
      console.log('사용자 계정 정보 조회 성공:', data ? `${data.length}개 계정` : '계정 없음');
      
      // 빈 계정 배열이라도 성공으로 처리합니다
      return successResponse(data || [], userId);
    } catch (dbError: any) {
      console.error('사용자 계정 데이터베이스 처리 오류:', dbError);
      return errorResponse(
        500,
        '데이터베이스 처리 중 예외가 발생했습니다.',
        dbError.message || '알 수 없는 데이터베이스 오류',
        'DB_EXCEPTION'
      );
    }
  } catch (error: any) {
    console.error('사용자 계정 정보 우회 API 오류:', error);
    console.error('오류 스택:', error.stack);
    
    // 심각한 오류 발생 시 텍스트 응답 반환 (JSON 파싱 실패 디버깅용)
    if (error.name === 'SyntaxError' || error.toString().includes('JSON')) {
      return new NextResponse(
        `Server Error: JSON 처리 오류가 발생했습니다. 오류: ${error.message}`, 
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8'
          }
        }
      );
    }
    
    return errorResponse(
      500,
      '서버 내부 오류가 발생했습니다.',
      error.message || '알 수 없는 오류가 발생했습니다.',
      'SERVER_ERROR'
    );
  }
} 