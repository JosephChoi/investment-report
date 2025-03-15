import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // URL에서 이메일 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: '이메일이 제공되지 않았습니다.' }, { status: 400 });
    }
    
    // 이메일을 소문자로 변환
    const normalizedEmail = email.toLowerCase();
    console.log('이메일 정규화:', email, '->', normalizedEmail);
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 사용자 테이블에서 이메일로 고객 정보 확인 (대소문자 구분 없이)
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('*')
      .ilike('email', normalizedEmail)
      .single();
      
    if (userError && userError.code !== 'PGRST116') { // PGRST116: 결과가 없음
      console.error('사용자 정보 조회 오류:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    
    // 이미 가입된 사용자인지 확인
    const { data: authUser } = await serviceSupabase.auth.admin.listUsers();
    const existingUser = authUser.users.find(user => 
      user.email && user.email.toLowerCase() === normalizedEmail
    );
    
    // 고객 정보가 있는 경우
    if (userData) {
      console.log('고객 정보 확인됨:', userData);
      
      // 이미 가입된 사용자인 경우
      if (existingUser) {
        console.log('이미 가입된 사용자:', existingUser.id);
        
        // UUID가 일치하는지 확인
        const uuidMatch = userData.id === existingUser.id;
        console.log('UUID 일치 여부:', uuidMatch, userData.id, existingUser.id);
        
        return NextResponse.json({ 
          exists: true, 
          customer: userData,
          isRegistered: true,
          uuidMatch,
          message: '이미 가입된 사용자입니다. 로그인해주세요.'
        });
      }
      
      // 고객 정보는 있지만 아직 가입하지 않은 경우
      return NextResponse.json({ 
        exists: true, 
        customer: userData,
        isRegistered: false,
        message: '고객 정보가 확인되었습니다. 회원가입을 진행해주세요.'
      });
    }
    
    // 고객 정보가 없는 경우 (이메일이 users 테이블에 없음)
    // 이미 가입된 사용자인지 다시 확인
    if (existingUser) {
      return NextResponse.json({ 
        exists: false, 
        isRegistered: true,
        message: '이미 가입된 이메일이지만 고객 정보가 없습니다. 관리자에게 문의하세요.'
      });
    }
    
    // 고객 정보가 없는 경우
    return NextResponse.json({ 
      exists: false, 
      isRegistered: false,
      message: '등록된 고객 정보가 없습니다. 관리자에게 문의하세요.'
    });
    
  } catch (error) {
    console.error('고객 이메일 확인 오류:', error);
    return NextResponse.json({ 
      error: (error as Error).message || '고객 정보 확인 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 