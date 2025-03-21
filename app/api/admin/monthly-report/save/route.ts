import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('세션 정보:', session ? '세션 있음' : '세션 없음', sessionError ? `오류: ${sessionError.message}` : '오류 없음');
    
    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: '인증되지 않은 사용자입니다. 다시 로그인해주세요.',
        },
        { status: 401 }
      );
    }
    
    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabaseAdmin
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
          success: false,
          error: '관리자만 월간 리포트를 저장할 수 있습니다.',
        },
        { status: 403 }
      );
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    
    // 필수 필드 확인
    if (!body.year_month || !body.title) {
      return NextResponse.json(
        {
          success: false,
          error: '연월(year_month)과 제목(title)은 필수 입력 항목입니다.',
        },
        { status: 400 }
      );
    }
    
    // 월간 리포트 저장
    const { data, error } = await supabaseAdmin
      .from('monthly_reports')
      .upsert(
        {
          year_month: body.year_month,
          title: body.title,
          content: body.content || null,
          created_by: session.user.id,
          updated_by: session.user.id,
        },
        { onConflict: 'year_month' }
      )
      .select()
      .single();
    
    if (error) {
      console.error('월간 리포트 저장 오류:', error);
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('월간 리포트 저장 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '월간 리포트 저장 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
} 