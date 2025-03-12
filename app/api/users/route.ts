import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 사용자 목록 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('사용자 검색 요청:', { searchTerm, page, limit });

    // 기본 쿼리 사용 - 필요한 필드만 선택
    let query = supabase
      .from('users')
      .select('id, name, phone')
      .order('name');

    // 검색어가 있는 경우 필터링 - 이름과 전화번호만 검색
    if (searchTerm) {
      query = query.or(
        `name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
      console.log('검색 필터 적용:', `name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    // 페이지네이션 적용
    query = query.range(offset, offset + limit - 1);

    console.log('실행할 쿼리 정보:', { 
      table: 'users', 
      select: 'id, name, phone', 
      filter: searchTerm ? `name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%` : 'none',
      range: `${offset}-${offset + limit - 1}`
    });
    const { data, error } = await query;

    if (error) {
      console.error('사용자 목록 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('사용자 검색 결과(중복 제거 전):', data?.length || 0);
    
    // 중복 제거 - 이름과 전화번호가 같은 사용자는 한 번만 표시
    let uniqueUsers: { id: string; name: string; phone: string | null }[] = [];
    if (data && data.length > 0) {
      // 중복 체크를 위한 Set
      const uniqueKeys = new Set<string>();
      
      // 중복 제거된 사용자 목록 생성
      uniqueUsers = data.filter(user => {
        // 이름과 전화번호를 조합한 키 생성
        const key = `${user.name}|${user.phone || ''}`;
        
        // 이미 처리한 키인지 확인
        if (uniqueKeys.has(key)) {
          return false; // 중복이므로 제외
        }
        
        // 새로운 키 추가
        uniqueKeys.add(key);
        return true; // 중복이 아니므로 포함
      });
      
      console.log('사용자 검색 결과(중복 제거 후):', uniqueUsers.length);
      console.log('제거된 중복 수:', data.length - uniqueUsers.length);
    }
    
    // 결과가 없는 경우 빈 배열 반환
    if (!uniqueUsers || uniqueUsers.length === 0) {
      console.log('검색 결과 없음');
      
      // 검색어가 있는 경우 직접 SQL 쿼리 시도
      if (searchTerm) {
        console.log('직접 SQL 쿼리로 재시도');
        const { data: sqlData, error: sqlError } = await supabase.rpc('search_users_direct', {
          search_query: searchTerm,
          page_limit: limit,
          page_offset: offset
        });
        
        if (!sqlError && sqlData && sqlData.length > 0) {
          // SQL 결과에서도 중복 제거
          const uniqueKeys = new Set<string>();
          const uniqueSqlUsers = sqlData.filter((user: any) => {
            const key = `${user.name}|${user.phone || ''}`;
            if (uniqueKeys.has(key)) return false;
            uniqueKeys.add(key);
            return true;
          });
          
          console.log('SQL 쿼리 결과(중복 제거 후):', uniqueSqlUsers.length);
          return NextResponse.json({
            users: uniqueSqlUsers,
            pagination: {
              page,
              limit,
              total: uniqueSqlUsers.length,
              totalPages: Math.ceil(uniqueSqlUsers.length / limit)
            }
          });
        }
      }
      
      return NextResponse.json({
        users: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    // 전체 개수 조회
    let countQuery = supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 검색어가 있는 경우 필터링
    if (searchTerm) {
      countQuery = countQuery.or(
        `name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('사용자 개수 조회 오류:', countError);
    }

    return NextResponse.json({
      users: uniqueUsers,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('사용자 목록 API 오류:', error);
    
    // 오류 발생 시 빈 배열 반환
    return NextResponse.json({
      users: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    });
  }
} 