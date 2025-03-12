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

    // 필수 필드 검증
    if (!user_id || !title || !content || !consultation_date) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 서비스 역할 키를 사용하는 클라이언트로 변경 (RLS 우회)
    const serviceSupabase = getServiceSupabase();

    // 상담 내역 생성
    const { data, error } = await serviceSupabase
      .from('consultations')
      .insert({
        user_id,
        title,
        content,
        consultation_date,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('상담 내역 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('상담 내역 생성 성공:', data[0].id);
    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (error) {
    console.error('상담 내역 생성 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 