import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// 특정 리밸런싱 내역 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/rebalancing-histories/${params.id}: 요청 시작`);
    
    const id = params.id;
    
    // 쿠키를 사용하여 Supabase 클라이언트 생성
    const cookieStore = cookies();
    const supabase = createClient({ cookies: () => cookieStore });
    
    // 특정 리밸런싱 내역 가져오기
    const { data, error } = await supabase
      .from('rebalancing_histories')
      .select(`
        *,
        portfolio_details:portfolio_types(id, name, description)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('리밸런싱 내역 조회 오류:', error);
      return NextResponse.json(
        { error: `리밸런싱 내역을 가져오는데 실패했습니다: ${error.message}` },
        { status: error.code === 'PGRST116' ? 404 : 500 } // PGRST116: 레코드가 없음
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('리밸런싱 내역 API 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류') },
      { status: 500 }
    );
  }
}

// 리밸런싱 내역 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`PUT /api/rebalancing-histories/${params.id}: 요청 시작`);
    
    // 요청 헤더에서 인증 토큰 확인
    const authHeader = request.headers.get('Authorization');
    console.log('인증 헤더 존재:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('인증 헤더가 없거나 올바르지 않습니다.');
      return NextResponse.json(
        { error: '유효한 인증 토큰이 필요합니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }
    
    const tokenFromHeader = authHeader.substring(7);
    console.log('헤더에서 토큰 추출됨 (길이):', tokenFromHeader.length);
    
    const id = params.id;
    const body = await request.json();
    console.log('요청 본문:', body);
    
    // 필수 필드 확인
    if (!body.portfolio_type_id || !body.rebalancing_date) {
      return NextResponse.json(
        { error: '포트폴리오 ID와 리밸런싱 날짜는 필수 항목입니다.' },
        { status: 400 }
      );
    }
    
    // Supabase 클라이언트 생성 (토큰 인증)
    const supabase = createClient();
    
    // 토큰으로 사용자 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenFromHeader);
    
    if (authError || !user) {
      console.error('사용자 검증 실패:', authError || '사용자 정보 없음');
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    console.log('인증된 사용자 ID:', user.id);
    
    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('사용자 권한 조회 오류:', userError);
      return NextResponse.json(
        { error: '사용자 정보를 가져오는데 실패했습니다: ' + userError.message },
        { status: 500 }
      );
    }
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }
    
    // 업데이트할 데이터
    const updateData = {
      portfolio_type_id: body.portfolio_type_id,
      rebalancing_date: body.rebalancing_date,
      comment: body.comment || '',
      reference_url: body.reference_url || null,
      updated_at: new Date().toISOString()
    };
    
    console.log('업데이트할 데이터:', updateData);
    
    // 리밸런싱 내역 수정
    const { data, error } = await supabaseAdmin
      .from('rebalancing_histories')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('리밸런싱 내역 수정 오류:', error);
      return NextResponse.json(
        { error: `리밸런싱 내역을 수정하는데 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('리밸런싱 내역 수정 API 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류') },
      { status: 500 }
    );
  }
}

// 리밸런싱 내역 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`DELETE /api/rebalancing-histories/${params.id}: 요청 시작`);
    
    // 요청 헤더에서 인증 토큰 확인
    const authHeader = request.headers.get('Authorization');
    console.log('인증 헤더 존재:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('인증 헤더가 없거나 올바르지 않습니다.');
      return NextResponse.json(
        { error: '유효한 인증 토큰이 필요합니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }
    
    const tokenFromHeader = authHeader.substring(7);
    console.log('헤더에서 토큰 추출됨 (길이):', tokenFromHeader.length);
    
    const id = params.id;
    
    // Supabase 클라이언트 생성 (토큰 인증)
    const supabase = createClient();
    
    // 토큰으로 사용자 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenFromHeader);
    
    if (authError || !user) {
      console.error('사용자 검증 실패:', authError || '사용자 정보 없음');
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    console.log('인증된 사용자 ID:', user.id);
    
    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('사용자 권한 조회 오류:', userError);
      return NextResponse.json(
        { error: '사용자 정보를 가져오는데 실패했습니다: ' + userError.message },
        { status: 500 }
      );
    }
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }
    
    // 리밸런싱 내역 삭제
    const { error } = await supabaseAdmin
      .from('rebalancing_histories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('리밸런싱 내역 삭제 오류:', error);
      return NextResponse.json(
        { error: `리밸런싱 내역을 삭제하는데 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('리밸런싱 내역 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류') },
      { status: 500 }
    );
  }
} 