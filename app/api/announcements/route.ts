import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementFormData } from '@/lib/types';
import { supabase, getServiceSupabase } from '@/lib/supabase';

// 모든 공지사항 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 가져오기
    const url = new URL(request.url);
    const importance_level = url.searchParams.get('importance_level');
    const target_type = url.searchParams.get('target_type');
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    console.log('공지사항 조회 요청:', { importance_level, target_type, start_date, end_date, page, limit });
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 쿼리 빌더
    let query = serviceSupabase
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
      console.error('공지사항 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`${data?.length || 0}개의 공지사항을 조회했습니다.`);
    return NextResponse.json({ data, count });
  } catch (error) {
    console.error('공지사항 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 새로운 공지사항 생성
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body: AnnouncementFormData = await request.json();
    
    console.log('공지사항 생성 요청:', { title: body.title, target_type: body.target_type });
    
    // 필수 필드 검증
    if (!body.title || !body.content || !body.importance_level || !body.target_type) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 요청 헤더에서 사용자 ID 가져오기 (없으면 기본값 사용)
    const userId = request.headers.get('x-user-id') || 'system';
    
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

    // 생성할 공지사항 데이터 객체
    const announcementData: any = {
      title: body.title,
      content: body.content,
      importance_level: body.importance_level,
      target_type: body.target_type,
      target_portfolios: targetPortfolios,
      created_by: userId
    };

    // 선택 필드: 사용자가 지정한 생성일이 있으면 사용
    if (body.created_at) {
      announcementData.created_at = body.created_at;
    }

    // 선택 필드: 링크 URL이 있으면 추가 (데이터베이스에는 reference_url로 저장)
    if (body.link_url) {
      announcementData.reference_url = body.link_url;
    } else if (body.reference_url) {
      announcementData.reference_url = body.reference_url;
    }
    
    // 공지사항 생성
    const { data, error } = await serviceSupabase
      .from('announcements')
      .insert(announcementData)
      .select()
      .single();
    
    if (error) {
      console.error('공지사항 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('공지사항 생성 성공:', data.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('공지사항 생성 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 