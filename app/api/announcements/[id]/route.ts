import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementFormData } from '@/lib/types';

// 특정 공지사항 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // 공지사항 조회
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        announcement_attachments(*)
      `)
      .eq('id', params.id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: '공지사항을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('공지사항 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 공지사항 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // 공지사항 수정
    const { data, error } = await supabase
      .from('announcements')
      .update({
        title: body.title,
        content: body.content,
        importance_level: body.importance_level,
        target_type: body.target_type,
        target_portfolios: body.target_portfolios || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('공지사항 수정 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // 공지사항 삭제 (첨부 파일은 CASCADE 설정으로 자동 삭제됨)
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('공지사항 삭제 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 