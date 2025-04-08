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
    
    // 로그인 체크와 권한 확인 없이 바로 상담 내역 조회
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
  console.log(`상담 내역 조회 시작 - 사용자 ID: ${userId}, 페이지: ${page}, 한계: ${limit}, 오프셋: ${offset}`);
  
  // 먼저 사용자의 이름을 가져옵니다
  let userName = null;
  // 상담 내역과 총 개수를 저장할 변수
  let consultationsData: any[] = [];
  let totalCount = 0;

  try {
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('사용자 정보 조회 오류:', userError);
      console.log('사용자 ID가 유효하지 않을 수 있습니다:', userId);
    } else if (userData) {
      console.log('사용자 정보 확인됨:', userData.name, userData.email);
      userName = userData.name;
    }
  } catch (e) {
    console.warn('사용자 확인 중 오류:', e);
  }

  // 사용자 이름이 있으면 이름으로 상담 내역 조회 시도 (더 신뢰할 수 있음)
  if (userName) {
    console.log(`사용자 이름(${userName})으로 상담 내역 조회 시도`);
    
    try {
      // 동일한 이름의 사용자 모두 찾기
      const { data: usersWithSameName, error: sameNameError } = await serviceSupabase
        .from('users')
        .select('id, name')
        .eq('name', userName);
      
      if (sameNameError) {
        console.error('동일 이름 사용자 조회 오류:', sameNameError);
      } else if (usersWithSameName && usersWithSameName.length > 0) {
        console.log(`동일 이름(${userName}) 사용자 ${usersWithSameName.length}명 찾음:`, usersWithSameName.map(u => u.id));
        
        // 동일 이름 사용자들의 ID 목록 
        const userIds = usersWithSameName.map(u => u.id);
        
        // 이 사용자들의 상담 내역 조회
        const { data: consultationsByName, error: nameQueryError } = await serviceSupabase
          .from('consultations')
          .select('*')
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (nameQueryError) {
          console.error('이름 기반 상담 내역 조회 오류:', nameQueryError);
        } else {
          console.log(`이름 기반 조회 결과: ${consultationsByName?.length || 0}개 상담 내역 발견`);
          
          if (consultationsByName && consultationsByName.length > 0) {
            consultationsData = consultationsByName;
            
            // 이름 기반으로 전체 개수 조회
            const { count: nameBasedCount, error: nameCountError } = await serviceSupabase
              .from('consultations')
              .select('*', { count: 'exact', head: true })
              .in('user_id', userIds);
            
            if (nameCountError) {
              console.error('이름 기반 개수 조회 오류:', nameCountError);
            } else {
              console.log(`이름 기반 총 개수: ${nameBasedCount}`);
              // 전체 개수 정보 저장 (이후 사용)
              totalCount = nameBasedCount || 0;
            }
          }
        }
      }
    } catch (nameError) {
      console.error('이름 기반 조회 중 오류:', nameError);
    }
  }
  
  // 이름 기반 조회로 데이터를 찾지 못한 경우에만 ID 기반 조회 시도
  if (!consultationsData || consultationsData.length === 0) {
    console.log('ID 기반 상담 내역 조회 시도');
     
    const { data: idBasedData, error: idQueryError } = await serviceSupabase
      .from('consultations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
     
    if (idQueryError) {
      console.error('ID 기반 상담 내역 조회 오류:', idQueryError);
    } else {
      console.log(`ID 기반 조회 결과: ${idBasedData?.length || 0}개 상담 내역 발견`);
      consultationsData = idBasedData || [];
       
      // ID 기반으로 전체 개수 조회
      if (idBasedData && idBasedData.length > 0) {
        const { count: idBasedCount, error: idCountError } = await serviceSupabase
          .from('consultations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        if (idCountError) {
          console.error('ID 기반 개수 조회 오류:', idCountError);
        } else {
          console.log(`ID 기반 총 개수: ${idBasedCount}`);
          totalCount = idBasedCount || 0;
        }
      }
    }
  }

  // 모든 시도 후에도 데이터가 없는 경우
  if (!consultationsData || consultationsData.length === 0) {
    console.log('모든 검색 방법으로도 상담 내역을 찾지 못했습니다.');
    
    return NextResponse.json({
      data: [],
      message: '상담 내역이 없습니다. 관리자에게 문의하세요.',
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      }
    });
  }

  console.log('조회된 상담 내역 ID 목록:', consultationsData.map(c => c.id));
  consultationsData.forEach((consultation, idx) => {
    console.log(`상담 내역 #${idx + 1}:`, {
      id: consultation.id,
      user_id: consultation.user_id,
      title: consultation.title,
      date: consultation.consultation_date,
      created_at: consultation.created_at
    });
  });
  
  // 디버깅: 상담 내역 상세 정보 및 URL 체크
  console.log('상담 내역 상세 처리 전 확인:');
  consultationsData.forEach((c, i) => {
    console.log(`[${i}] ID: ${c.id}, 제목: ${c.title}, URL: ${c.reference_url || '없음'}`);
  });

  // 각 상담 내역에 대한 첨부 파일 정보 조회
  const consultationsWithAttachments = await Promise.all(
    consultationsData.map(async (consultation: any) => {
      // 사용자 정보 조회
      let userData = null;
      try {
        const { data, error } = await serviceSupabase
          .from('users')
          .select('id, name, email, account_number, phone')
          .eq('id', consultation.user_id)
          .single();
          
        if (error) {
          console.error(`사용자 정보 조회 오류 (user_id: ${consultation.user_id}):`, error);
        } else {
          userData = data;
        }
      } catch (e) {
        console.warn(`사용자 정보 조회 중 오류 (consultation_id: ${consultation.id}):`, e);
      }
      
      // 첨부 파일 정보 조회
      const { data: attachmentsData, error: attachmentsError } = await serviceSupabase
        .from('consultation_attachments')
        .select('id, file_name, file_url, file_type, file_size')
        .eq('consultation_id', consultation.id);
      
      if (attachmentsError) {
        console.error(`첨부 파일 조회 오류 (consultation_id: ${consultation.id}):`, attachmentsError);
      }
      
      // 데이터 필드 확인 및 구조화
      const processedConsultation = {
        ...consultation,
        users: userData,
        consultation_attachments: attachmentsData || [],
        reference_url: consultation.reference_url || null // 참조 URL이 없을 경우 명시적으로 null 처리
      };
      
      // 상담 내역 디버그
      console.log(`상담 내역 ${consultation.id} 상세 정보:`, {
        id: consultation.id,
        title: consultation.title,
        reference_url: consultation.reference_url || '없음',
        has_attachments: (attachmentsData?.length || 0) > 0
      });

      return processedConsultation;
    })
  );
  
  // 응답 데이터에서 reference_url 확인
  console.log('최종 응답 데이터 reference_url 확인:');
  consultationsWithAttachments.forEach((c, i) => {
    console.log(`[${i}] ID: ${c.id}, URL: ${c.reference_url || '없음'}`);
  });

  // 응답 데이터 디버깅
  const responseData = {
    data: consultationsWithAttachments,
    pagination: {
      page,
      limit,
      total: totalCount || 0,
      totalPages: Math.ceil((totalCount || 0) / limit)
    }
  };
  
  console.log('응답 데이터 요약:', JSON.stringify({
    dataLength: responseData.data.length,
    pagination: responseData.pagination
  }));
  
  return NextResponse.json(responseData);
} 