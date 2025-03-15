import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { id, email, password, name, phone } = await request.json();
    
    if (!id || !email || !password) {
      return NextResponse.json({ 
        error: 'ID, 이메일, 비밀번호는 필수 항목입니다.' 
      }, { status: 400 });
    }
    
    console.log('기존 UUID로 Auth 사용자 생성 요청:', { id, email, name });
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 이미 가입된 사용자인지 확인
    const { data: existingUsers } = await serviceSupabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(user => 
      user.email && user.email.toLowerCase() === email.toLowerCase()
    );
    
    if (existingUser) {
      console.log('이미 가입된 사용자:', existingUser.id);
      return NextResponse.json({ 
        error: '이미 가입된 이메일입니다. 로그인해주세요.' 
      }, { status: 400 });
    }
    
    try {
      // Supabase REST API를 직접 호출하여 기존 UUID로 사용자 생성
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL 또는 Service Role Key가 설정되지 않았습니다.');
      }
      
      // 사용자 메타데이터 준비
      const userMetadata = {
        name: name || email.split('@')[0],
        phone: phone || ''
      };
      
      // Supabase Auth API 직접 호출
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          id,
          email,
          password,
          email_confirm: true,
          user_metadata: userMetadata
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Supabase Auth API 오류:', result);
        throw new Error(result.message || '사용자 생성 중 오류가 발생했습니다.');
      }
      
      console.log('사용자 생성 성공:', { id, email });
      
      // 생성된 사용자 정보 반환
      return NextResponse.json({ 
        success: true, 
        data: {
          user: result
        }
      });
    } catch (error) {
      console.error('사용자 생성 중 오류:', error);
      return NextResponse.json({ 
        error: (error as Error).message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('사용자 생성 API 오류:', error);
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 