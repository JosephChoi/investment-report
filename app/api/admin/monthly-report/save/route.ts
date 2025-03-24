import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // 요청 헤더에서 인증 토큰 확인
    const authHeader = request.headers.get('Authorization');
    console.log('인증 헤더 존재:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('인증 헤더가 없거나 올바르지 않습니다.');
      return NextResponse.json(
        {
          success: false,
          error: '유효한 인증 토큰이 필요합니다. 다시 로그인해주세요.',
        },
        { status: 401 }
      );
    }
    
    const tokenFromHeader = authHeader.substring(7);
    console.log('헤더에서 토큰 추출됨 (길이):', tokenFromHeader.length);
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 토큰으로 사용자 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenFromHeader);
    
    if (authError || !user) {
      console.error('사용자 검증 실패:', authError || '사용자 정보 없음');
      return NextResponse.json(
        {
          success: false,
          error: '인증에 실패했습니다. 다시 로그인해주세요.',
        },
        { status: 401 }
      );
    }
    
    console.log('사용자 검증 성공:', user.id);
    
    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
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
    
    console.log('월간 리포트 저장 시도:', body);
    
    // monthly_reports 테이블 구조 확인을 위한 조회 시도
    const { data: tableInfo, error: tableInfoError } = await supabaseAdmin
      .from('monthly_reports')
      .select('*')
      .limit(1);
    
    if (tableInfoError) {
      console.error('테이블 구조 조회 오류:', tableInfoError);
    }
    
    console.log('테이블 구조 정보:', tableInfo ? Object.keys(tableInfo[0]) : 'No data', tableInfoError ? `오류: ${tableInfoError.message}` : '오류 없음');
    
    // 저장할 데이터 객체 구성
    const monthlyReportData = {
      year_month: body.year_month,
      title: body.title,
      description: body.description || null
    };
    
    console.log('저장할 데이터:', monthlyReportData);
    
    // 월간 리포트 저장
    const { data, error } = await supabaseAdmin
      .from('monthly_reports')
      .upsert(monthlyReportData, { onConflict: 'year_month' })
      .select()
      .single();
    
    if (error) {
      console.error('월간 리포트 저장 오류:', error);
      throw error;
    }
    
    console.log('월간 리포트 저장 성공:', data);
    
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