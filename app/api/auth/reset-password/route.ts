import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: '이메일이 필요합니다.' }, { status: 400 });
    }
    
    // 비밀번호 재설정 이메일 전송
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });
    
    if (error) {
      console.error('비밀번호 재설정 이메일 전송 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`비밀번호 재설정 이메일이 ${email}로 전송되었습니다. 리디렉션 URL: ${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`);
    
    return NextResponse.json({ 
      success: true, 
      message: '비밀번호 설정 링크가 이메일로 전송되었습니다.' 
    });
    
  } catch (error: any) {
    console.error('비밀번호 재설정 오류:', error);
    return NextResponse.json({ 
      error: '비밀번호 재설정 링크 전송 중 오류가 발생했습니다.', 
      details: error.message 
    }, { status: 500 });
  }
} 