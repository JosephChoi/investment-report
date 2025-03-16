import { NextRequest, NextResponse } from 'next/server';
import { createClient, getServiceSupabase } from '@/lib/supabase';
import { OverduePaymentNoticeResponse } from '@/lib/overdue-types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 사용자 인증 확인
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('세션 정보:', session ? '세션 있음' : '세션 없음', sessionError ? `오류: ${sessionError.message}` : '오류 없음');
    
    if (sessionError || !session) {
      return NextResponse.json(
        {
          data: null,
          error: '인증되지 않은 사용자입니다. 다시 로그인해주세요.',
        },
        { status: 401 }
      );
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 안내문 ID 확인
    const noticeId = params.id;
    
    if (!noticeId) {
      return NextResponse.json(
        {
          data: null,
          error: '안내문 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }
    
    // 연체정보 안내문 조회 (서비스 역할 키 사용)
    const { data, error } = await serviceSupabase
      .from('overdue_payment_notices')
      .select('*')
      .eq('id', noticeId)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return NextResponse.json(
        {
          data: null,
          error: '해당 ID의 안내문을 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      data: data as OverduePaymentNoticeResponse,
      error: null,
    });
  } catch (error) {
    console.error('연체정보 안내문 조회 오류:', error);
    
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : '연체정보 안내문 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 사용자 인증 확인
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('세션 정보:', session ? '세션 있음' : '세션 없음', sessionError ? `오류: ${sessionError.message}` : '오류 없음');
    
    if (sessionError || !session) {
      return NextResponse.json(
        {
          data: null,
          error: '인증되지 않은 사용자입니다. 다시 로그인해주세요.',
        },
        { status: 401 }
      );
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 관리자 권한 확인
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    console.log('사용자 정보:', userData, userError ? `오류: ${userError.message}` : '오류 없음');
    
    if (userError) {
      throw userError;
    }
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        {
          data: null,
          error: '관리자만 연체정보 안내문을 수정할 수 있습니다.',
        },
        { status: 403 }
      );
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    
    if (!body.content) {
      return NextResponse.json(
        {
          data: null,
          error: '안내문 내용이 필요합니다.',
        },
        { status: 400 }
      );
    }
    
    // 연체정보 안내문 수정 (서비스 역할 키 사용)
    const { data, error } = await serviceSupabase
      .from('overdue_payment_notices')
      .update({
        content: body.content,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      data: data as OverduePaymentNoticeResponse,
      error: null,
    });
  } catch (error) {
    console.error('연체정보 안내문 수정 오류:', error);
    
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : '연체정보 안내문 수정 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
} 