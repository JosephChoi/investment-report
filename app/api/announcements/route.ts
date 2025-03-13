import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementFormData } from '@/lib/types';

// 모든 공지사항 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 토큰으로 세션 설정
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 관리자 권한 확인
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }
    
    // 쿼리 파라미터 가져오기
    const url = new URL(request.url);
    const importance_level = url.searchParams.get('importance_level');
    const target_type = url.searchParams.get('target_type');
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // 쿼리 빌더
    let query = supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // 필터 적용
    if (importance_level) {
      query = query.eq('importance_level', importance_level);
    }
    
    if (target_type) {
      query = query.eq('target_type', target_type);
    }
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    // 쿼리 실행
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data, count });
  } catch (error) {
    console.error('공지사항 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 새로운 공지사항 생성
export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 토큰으로 세션 설정
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 관리자 권한 확인
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }
    
    // 요청 본문 파싱
    const body: AnnouncementFormData = await request.json();
    
    // 필수 필드 검증
    if (!body.title || !body.content || !body.importance_level || !body.target_type) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    
    // 공지사항 생성
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: body.title,
        content: body.content,
        importance_level: body.importance_level,
        target_type: body.target_type,
        target_portfolios: body.target_portfolios || [],
        created_by: user.id
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('공지사항 생성 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 