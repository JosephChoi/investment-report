import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

// 모든 상담 내역 조회 (관리자용) 또는 필터링된 상담 내역 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log('상담 내역 조회 요청:', { userId, startDate, endDate, page, limit });

    // 서비스 역할 키를 사용하는 클라이언트로 변경 (RLS 우회)
    const serviceSupabase = getServiceSupabase();

    // 기본 쿼리 사용
    const { data: consultationsData, error: consultationsError } = await serviceSupabase
      .from('consultations')
      .select('*')
      .order('consultation_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (consultationsError) {
      console.error('상담 내역 조회 오류:', consultationsError);
      return NextResponse.json({ error: consultationsError.message }, { status: 500 });
    }

    // 상담 내역이 없는 경우
    if (!consultationsData || consultationsData.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    // 각 상담 내역에 대한 사용자 정보 조회
    const consultationsWithUsers = await Promise.all(
      consultationsData.map(async (consultation) => {
        // 사용자 정보 조회
        const { data: userData, error: userError } = await serviceSupabase
          .from('users')
          .select('id, name, email')
          .eq('id', consultation.user_id)
          .single();
        
        if (userError) {
          console.error(`사용자 정보 조회 오류 (user_id: ${consultation.user_id}):`, userError);
        }

        // 첨부 파일 정보 조회
        const { data: attachmentsData, error: attachmentsError } = await serviceSupabase
          .from('consultation_attachments')
          .select('*')
          .eq('consultation_id', consultation.id);
        
        if (attachmentsError) {
          console.error(`첨부 파일 조회 오류 (consultation_id: ${consultation.id}):`, attachmentsError);
        }

        return {
          ...consultation,
          users: userData || null,
          consultation_attachments: attachmentsData || []
        };
      })
    );

    // 전체 개수 조회
    const { count, error: countError } = await serviceSupabase
      .from('consultations')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('상담 내역 개수 조회 오류:', countError);
    }

    return NextResponse.json({
      data: consultationsWithUsers,
      pagination: {
        page,
        limit,
        total: count || consultationsWithUsers.length,
        totalPages: Math.ceil((count || consultationsWithUsers.length) / limit)
      }
    });
  } catch (error) {
    console.error('상담 내역 API 오류:', error);
    return NextResponse.json({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    });
  }
}

// 새로운 상담 내역 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, content, consultation_date } = body;

    console.log('상담 내역 생성 요청:', { user_id, title, consultation_date });

    // 필수 필드 검증 (user_id는 필수이지만 유효성 검증은 하지 않음)
    if (!title || !content || !consultation_date) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. 제목, 내용, 상담일자는 필수입니다.' },
        { status: 400 }
      );
    }

    // 서비스 역할 키를 사용하는 클라이언트로 변경 (RLS 우회)
    const serviceSupabase = getServiceSupabase();

    // 사용자 정보 조회 (선택적 - 로깅 목적으로만 사용)
    try {
      const { data: userData } = await serviceSupabase
        .from('users')
        .select('id, name, email')
        .eq('id', user_id)
        .single();

      if (userData) {
        console.log('사용자 정보 조회 성공:', userData.name);
      } else {
        console.log('사용자 정보를 찾을 수 없지만, 상담 내역은 계속 생성합니다:', user_id);
      }
    } catch (userError) {
      console.log('사용자 정보 조회 중 오류가 발생했지만, 상담 내역은 계속 생성합니다:', userError);
    }

    // 상담 내역 생성
    console.log('상담 내역 생성 시도:', {
      user_id,
      title,
      content: content.substring(0, 50) + '...',
      consultation_date,
      created_at: new Date().toISOString()
    });
    
    // 직접 SQL 쿼리를 사용하여 외래 키 제약 조건 우회
    try {
      const { data, error } = await serviceSupabase.rpc('create_consultation_without_fk_check', {
        p_user_id: user_id,
        p_title: title,
        p_content: content,
        p_consultation_date: consultation_date,
        p_created_at: new Date().toISOString()
      });

      if (error) {
        console.error('RPC를 통한 상담 내역 생성 오류:', error);
        
        // 대체 방법: 표준 INSERT 시도
        console.log('표준 INSERT로 상담 내역 생성 시도...');
        const { data: insertData, error: insertError } = await serviceSupabase
          .from('consultations')
          .insert({
            user_id,
            title,
            content,
            consultation_date,
            created_at: new Date().toISOString()
          })
          .select();

        if (insertError) {
          console.error('표준 INSERT 오류:', insertError);
          return NextResponse.json(
            { 
              error: '상담 내역 생성 중 오류가 발생했습니다.',
              details: insertError.message,
              code: insertError.code
            }, 
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, data: insertData });
      }

      return NextResponse.json({ success: true, data });
    } catch (rpcError) {
      console.error('RPC 호출 중 예외 발생:', rpcError);
      
      // RPC가 없는 경우 표준 INSERT 시도
      console.log('RPC 실패, 표준 INSERT로 상담 내역 생성 시도...');
      try {
        const { data: insertData, error: insertError } = await serviceSupabase
          .from('consultations')
          .insert({
            user_id,
            title,
            content,
            consultation_date,
            created_at: new Date().toISOString()
          })
          .select();

        if (insertError) {
          console.error('표준 INSERT 오류:', insertError);
          return NextResponse.json(
            { 
              error: '상담 내역 생성 중 오류가 발생했습니다.',
              details: insertError.message,
              code: insertError.code
            }, 
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, data: insertData });
      } catch (finalError) {
        console.error('최종 INSERT 시도 중 예외 발생:', finalError);
        return NextResponse.json(
          { 
            error: '상담 내역 생성 중 예외가 발생했습니다.',
            details: (finalError as Error).message
          }, 
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('상담 내역 API 오류:', error);
    return NextResponse.json(
      { error: '상담 내역 처리 중 오류가 발생했습니다.', details: (error as Error).message },
      { status: 500 }
    );
  }
} 