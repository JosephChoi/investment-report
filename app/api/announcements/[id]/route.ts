import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementFormData } from '@/lib/types';
import { getServiceSupabase } from '@/lib/supabase';

// 특정 공지사항 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string | Promise<string> } }
) {
  try {
    // Next.js 15에서는 params.id가 Promise일 수 있으므로 await 사용
    const id = typeof params.id === 'string' ? params.id : await params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: '공지사항 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트로 직접 조회
    // RLS 정책을 우회하여 항상 데이터에 접근 가능
    const serviceSupabase = getServiceSupabase();
    
    // 공지사항 상세 정보 가져오기
    const { data: announcement, error } = await serviceSupabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('공지사항 상세 정보 가져오기 오류:', error);
      return NextResponse.json(
        { error: '공지사항을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }
    
    if (!announcement) {
      return NextResponse.json(
        { error: '해당 ID의 공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    console.log('공지사항 조회 성공:', id);
    return NextResponse.json({ data: announcement });
  } catch (error) {
    console.error('공지사항 상세 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 공지사항 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string | Promise<string> } }
) {
  try {
    // Next.js 15에서는 params.id가 Promise일 수 있으므로 await 사용
    const announcementId = typeof params.id === 'string' ? params.id : await params.id;
    
    console.log('공지사항 수정 API 호출됨 - 공지사항 ID:', announcementId);
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 요청 본문 파싱
    const body: AnnouncementFormData = await request.json();
    
    // 필수 필드 검증
    if (!body.title || !body.content || !body.importance_level || !body.target_type) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    
    // 포트폴리오 ID 처리 - UUID 배열 형식으로 변환
    let targetPortfolios: string[] = [];
    if (body.target_portfolios && body.target_portfolios.length > 0) {
      // 문자열 배열을 UUID 배열로 변환
      targetPortfolios = body.target_portfolios.map(id => {
        try {
          // 이미 UUID 형식인지 확인
          return id;
        } catch (e) {
          console.error('포트폴리오 ID UUID 변환 오류:', e);
          return id;
        }
      });
    }
    
    console.log('대상 포트폴리오 ID:', targetPortfolios);
    
    // 공지사항 수정 - single() 대신 limit(1) 사용
    const { data, error } = await serviceSupabase
      .from('announcements')
      .update({
        title: body.title,
        content: body.content,
        importance_level: body.importance_level,
        target_type: body.target_type,
        target_portfolios: targetPortfolios,
        updated_at: new Date().toISOString()
      })
      .eq('id', announcementId)
      .select()
      .limit(1);
    
    if (error) {
      console.error('공지사항 수정 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: '수정할 공지사항을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    console.log('공지사항 수정 성공:', announcementId);
    return NextResponse.json({ data: data[0] });
  } catch (error) {
    console.error('공지사항 수정 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string | Promise<string> } }
) {
  try {
    // Next.js 15에서는 params.id가 Promise일 수 있으므로 await 사용
    const announcementId = typeof params.id === 'string' ? params.id : await params.id;
    
    console.log('공지사항 삭제 API 호출됨 - 공지사항 ID:', announcementId);
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 공지사항 삭제
    const { error } = await serviceSupabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);
    
    if (error) {
      console.error('공지사항 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('공지사항 삭제 성공:', announcementId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('공지사항 삭제 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 