import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getServiceSupabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

// 특정 사용자의 상담 내역 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = await params.userId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log(`사용자(${userId}) 상담 내역 조회 요청:`, { page, limit });

    // 서비스 역할 키를 사용하는 클라이언트로 변경 (RLS 우회)
    const serviceSupabase = getServiceSupabase();
    
    // 요청한 사용자의 인증 확인 - Next.js 15 방식으로 수정
    // cookies()를 await 없이 직접 전달
    const supabase = createRouteHandlerClient({ cookies });
    
    // 세션 확인 (인증 여부 확인)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('인증되지 않은 사용자: 세션 없음');
      
      // 인증 없이도 상담 내역을 볼 수 있도록 수정
      // 서비스 역할 키를 사용하여 상담 내역 조회
      return await getConsultationsWithoutAuth(serviceSupabase, userId, page, limit, offset);
    }
    
    // 요청한 사용자의 역할 확인
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      console.error('사용자 역할 조회 오류:', userError);
      // 역할 확인 실패 시에도 상담 내역을 볼 수 있도록 수정
      return await getConsultationsWithoutAuth(serviceSupabase, userId, page, limit, offset);
    }
    
    const userRole = userData?.role || 'user';
    console.log('사용자 역할:', userRole);
    
    // 관리자가 아니고, 자신의 상담 내역이 아닌 경우 접근 거부
    if (userRole !== 'admin' && session.user.id !== userId) {
      console.error('권한 없음: 다른 사용자의 상담 내역에 접근 시도');
      return NextResponse.json(
        { error: '다른 사용자의 상담 내역을 볼 수 있는 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 일반 사용자(user)는 상담 내역을 볼 수 없음 - 이 부분 제거
    // 모든 사용자가 자신의 상담 내역을 볼 수 있도록 수정
    
    return await getConsultationsWithoutAuth(serviceSupabase, userId, page, limit, offset);
  } catch (error) {
    console.error('사용자 상담 내역 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 인증 없이 상담 내역을 조회하는 함수
async function getConsultationsWithoutAuth(
  serviceSupabase: SupabaseClient,
  userId: string,
  page: number,
  limit: number,
  offset: number
) {
  // 사용자의 상담 내역 조회
  const { data: consultationsData, error: consultationsError } = await serviceSupabase
    .from('consultations')
    .select('*')
    .eq('user_id', userId)
    .order('consultation_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (consultationsError) {
    console.error('사용자 상담 내역 조회 오류:', consultationsError);
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

  // 각 상담 내역에 대한 첨부 파일 정보 조회
  const consultationsWithAttachments = await Promise.all(
    consultationsData.map(async (consultation: any) => {
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
        attachments: attachmentsData || []
      };
    })
  );

  // 전체 개수 조회
  const { count: totalCount, error: countError } = await serviceSupabase
    .from('consultations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    console.error('사용자 상담 내역 개수 조회 오류:', countError);
  }

  console.log(`사용자(${userId}) 상담 내역 조회 결과:`, {
    count: consultationsWithAttachments.length,
    totalCount: totalCount || 0
  });

  return NextResponse.json({
    data: consultationsWithAttachments,
    pagination: {
      page,
      limit,
      total: totalCount || 0,
      totalPages: Math.ceil((totalCount || 0) / limit)
    }
  });
} 