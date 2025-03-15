import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// 전화번호를 E.164 형식으로 변환하는 함수
function formatPhoneToE164(phone: string): string {
  if (!phone) return '';
  
  // 하이픈, 공백 등 특수문자 제거
  const digits = phone.replace(/\D/g, '');
  
  // 한국 번호인 경우 (010으로 시작하는 경우)
  if (digits.startsWith('010')) {
    // 앞의 0을 제거하고 +82 추가
    return `+82${digits.substring(1)}`;
  }
  
  // 이미 +로 시작하는 경우 그대로 반환
  if (phone.startsWith('+')) {
    return digits;
  }
  
  // 기타 경우 (국가 코드가 없는 경우) 한국 번호로 가정
  return `+82${digits}`;
}

export async function POST(request: NextRequest) {
  try {
    const { id, email, password, name, phone } = await request.json();
    
    if (!id || !email || !password) {
      return NextResponse.json({ 
        error: 'ID, 이메일, 비밀번호는 필수 항목입니다.' 
      }, { status: 400 });
    }
    
    console.log('기존 UUID로 Auth 사용자 생성 요청:', { id, email, name, phone });
    
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
      
      // 이름 기본값 설정
      const displayName = name || email.split('@')[0];
      
      // 전화번호를 E.164 형식으로 변환
      const formattedPhone = formatPhoneToE164(phone);
      console.log('전화번호 변환:', phone, '->', formattedPhone);
      
      // 사용자 메타데이터 준비
      const userMetadata = {
        name: displayName,
        phone: phone || '',
        full_name: displayName
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
          phone: formattedPhone,
          user_metadata: userMetadata,
          app_metadata: {},
          raw_user_meta_data: {
            name: displayName,
            full_name: displayName,
            phone: phone || ''
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Supabase Auth API 오류:', result);
        throw new Error(result.message || '사용자 생성 중 오류가 발생했습니다.');
      }
      
      console.log('사용자 생성 성공:', { id, email, phone: formattedPhone, displayName });
      
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