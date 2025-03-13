import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementFormData } from '@/lib/types';
import { getServiceSupabase } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 특정 공지사항 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 사용자 인증 확인
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }
    
    // 공지사항 ID 가져오기
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: '공지사항 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 공지사항 상세 정보 가져오기
    const { data: announcement, error } = await supabase
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
  { params }: { params: { id: string } }
) {
  try {
    // params 객체에서 id 추출
    const announcementId = params.id;
    console.log('공지사항 수정 API 호출됨 - 공지사항 ID:', announcementId);
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('인증 토큰이 없음');
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
      console.error('인증되지 않은 사용자:', authError);
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    console.log('공지사항 수정 요청 - 사용자 ID:', user.id, '이메일:', user.email);
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 사용자 역할 확인 (서비스 역할 키 사용)
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .limit(1);
    
    console.log('사용자 역할 조회 결과:', userData, userError);
    
    let isAdmin = false;
    
    if (userError || !userData || userData.length === 0) {
      console.error('사용자 역할 조회 오류:', userError);
      // 하드코딩된 이메일로 관리자 확인 (백업 방법)
      if (user.email === 'kunmin.choi@gmail.com') {
        console.log('하드코딩된 이메일로 관리자 확인 성공');
        isAdmin = true;
      }
    } else if (userData[0] && userData[0].role === 'admin') {
      console.log('사용자 역할 확인 성공: 관리자');
      isAdmin = true;
    } else {
      console.log('사용자 역할 확인: 관리자 아님', userData);
      // 하드코딩된 이메일로 관리자 확인 (백업 방법)
      if (user.email === 'kunmin.choi@gmail.com') {
        console.log('하드코딩된 이메일로 관리자 확인 성공');
        isAdmin = true;
      }
    }
    
    if (!isAdmin) {
      console.error('권한 없음: 관리자가 아님');
      return NextResponse.json({ error: '권한이 없습니다. 관리자만 공지사항을 수정할 수 있습니다.' }, { status: 403 });
    }
    
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
  { params }: { params: { id: string } }
) {
  try {
    // params 객체에서 id 추출
    const announcementId = params.id;
    console.log('공지사항 삭제 API 호출됨 - 공지사항 ID:', announcementId);
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('인증 토큰이 없음');
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
      console.error('인증되지 않은 사용자:', authError);
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    console.log('공지사항 삭제 요청 - 사용자 ID:', user.id, '이메일:', user.email);
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 사용자 역할 확인 (서비스 역할 키 사용)
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .limit(1);
    
    console.log('사용자 역할 조회 결과:', userData, userError);
    
    let isAdmin = false;
    
    if (userError || !userData || userData.length === 0) {
      console.error('사용자 역할 조회 오류:', userError);
      // 하드코딩된 이메일로 관리자 확인 (백업 방법)
      if (user.email === 'kunmin.choi@gmail.com') {
        console.log('하드코딩된 이메일로 관리자 확인 성공');
        isAdmin = true;
      }
    } else if (userData[0] && userData[0].role === 'admin') {
      console.log('사용자 역할 확인 성공: 관리자');
      isAdmin = true;
    } else {
      console.log('사용자 역할 확인: 관리자 아님', userData);
      // 하드코딩된 이메일로 관리자 확인 (백업 방법)
      if (user.email === 'kunmin.choi@gmail.com') {
        console.log('하드코딩된 이메일로 관리자 확인 성공');
        isAdmin = true;
      }
    }
    
    if (!isAdmin) {
      console.error('권한 없음: 관리자가 아님');
      return NextResponse.json({ error: '권한이 없습니다. 관리자만 공지사항을 삭제할 수 있습니다.' }, { status: 403 });
    }
    
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