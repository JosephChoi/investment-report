import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// 사용자 역할 직접 업데이트 API
export async function GET(request: NextRequest) {
  try {
    // URL에서 사용자 ID 또는 이메일 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    
    if ((!userId && !email) || !role) {
      return NextResponse.json({ error: '사용자 ID 또는 이메일과 역할이 필요합니다.' }, { status: 400 });
    }
    
    // 역할 값 검증
    if (role !== 'admin' && role !== 'user' && role !== 'customer') {
      return NextResponse.json({ error: '유효한 역할이 아닙니다. (admin, user 또는 customer)' }, { status: 400 });
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    let userData;
    
    // 사용자 ID 또는 이메일로 사용자 찾기
    if (userId) {
      const { data, error } = await serviceSupabase
        .from('users')
        .select('id, email')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('사용자 조회 오류:', error);
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
      }
      
      userData = data;
    } else if (email) {
      const { data, error } = await serviceSupabase
        .from('users')
        .select('id, email')
        .ilike('email', email)
        .single();
      
      if (error) {
        console.error('사용자 조회 오류:', error);
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
      }
      
      userData = data;
    }
    
    if (!userData) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 사용자 역할 업데이트
    const { error: updateError } = await serviceSupabase
      .from('users')
      .update({ role })
      .eq('id', userData.id);
    
    if (updateError) {
      console.error('사용자 역할 업데이트 오류:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    console.log(`사용자 역할 업데이트 완료: ${userData.id}, 이메일: ${userData.email}, 역할: ${role}`);
    return NextResponse.json({ 
      success: true, 
      message: '사용자 역할이 업데이트되었습니다.',
      data: {
        id: userData.id,
        email: userData.email,
        role: role
      }
    });
  } catch (error) {
    console.error('사용자 역할 업데이트 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 