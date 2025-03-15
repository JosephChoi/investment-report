import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// 사용자 역할 조회 API
export async function GET(request: NextRequest) {
  try {
    // URL에서 사용자 ID 또는 이메일 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    
    if (!userId && !email) {
      return NextResponse.json({ error: '사용자 ID 또는 이메일이 필요합니다.' }, { status: 400 });
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    let query = serviceSupabase.from('users').select('id, email, role');
    
    if (userId) {
      query = query.eq('id', userId);
    } else if (email) {
      query = query.ilike('email', email);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('사용자 역할 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('사용자 역할 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 사용자 역할 업데이트 API
export async function POST(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 요청 본문 파싱
    const body = await request.json();
    const { userId, role } = body;
    
    // 필수 필드 검증
    if (!userId || !role) {
      return NextResponse.json({ error: '사용자 ID와 역할이 필요합니다.' }, { status: 400 });
    }
    
    // 역할 값 검증
    if (role !== 'admin' && role !== 'user' && role !== 'customer') {
      return NextResponse.json({ error: '유효한 역할이 아닙니다. (admin, user 또는 customer)' }, { status: 400 });
    }
    
    console.log(`사용자 역할 업데이트 요청: 사용자 ID ${userId}, 역할 ${role}`);
    
    // users 테이블에 사용자가 존재하는지 확인
    const { data: existingUser, error: checkError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (checkError) {
      // 사용자가 존재하지 않는 경우 새로 생성
      if (checkError.code === 'PGRST116') {
        const { data: userData, error: authError } = await serviceSupabase
          .auth
          .admin
          .getUserById(userId);
        
        if (authError) {
          console.error('사용자 정보 조회 오류:', authError);
          return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }
        
        // users 테이블에 사용자 생성
        const { error: insertError } = await serviceSupabase
          .from('users')
          .insert({
            id: userId,
            email: userData.user?.email,
            role: role
          });
        
        if (insertError) {
          console.error('사용자 생성 오류:', insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        
        console.log(`새 사용자 생성 및 역할 설정 완료: ${userId}, 역할: ${role}`);
        return NextResponse.json({ success: true, message: '사용자가 생성되고 역할이 설정되었습니다.' });
      }
      
      console.error('사용자 확인 오류:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    // 사용자 역할 업데이트
    const { error: updateError } = await serviceSupabase
      .from('users')
      .update({ role })
      .eq('id', userId);
    
    if (updateError) {
      console.error('사용자 역할 업데이트 오류:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    console.log(`사용자 역할 업데이트 완료: ${userId}, 역할: ${role}`);
    return NextResponse.json({ success: true, message: '사용자 역할이 업데이트되었습니다.' });
  } catch (error) {
    console.error('사용자 역할 업데이트 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 