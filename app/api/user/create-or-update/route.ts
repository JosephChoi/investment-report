import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 사용자 정보 가져오기
    const userData = await request.json();
    
    if (!userData.id || !userData.email) {
      return NextResponse.json({ 
        success: false, 
        error: '사용자 ID와 이메일은 필수 항목입니다.' 
      }, { status: 400 });
    }
    
    // 이메일을 소문자로 변환
    const normalizedEmail = userData.email.toLowerCase();
    console.log('이메일 정규화:', userData.email, '->', normalizedEmail);
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 사용자 정보 조회 (소문자로 변환된 이메일 사용)
    const { data: existingUser, error: userError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();
      
    if (userError && userError.code !== 'PGRST116') {
      console.error('사용자 정보 조회 오류:', userError);
      return NextResponse.json({ 
        success: false, 
        error: userError.message 
      }, { status: 500 });
    }
    
    let result;
    
    // 사용자 정보가 없으면 생성, 있으면 업데이트
    if (!existingUser) {
      console.log('사용자 정보 생성 시도:', {...userData, email: normalizedEmail});
      
      // 특정 이메일은 항상 관리자 역할 부여 (나머지는 모두 customer로 통일)
      const isAdminEmail = normalizedEmail === 'kunmin.choi@gmail.com';
      const role = isAdminEmail ? 'admin' : 'customer';
      
      const { data: newUser, error: createError } = await serviceSupabase
        .from('users')
        .insert({
          id: userData.id,
          email: normalizedEmail,
          name: userData.name || normalizedEmail.split('@')[0],
          phone: userData.phone || null,
          role: role
        })
        .select();
        
      if (createError) {
        console.error('사용자 정보 생성 오류:', createError);
        return NextResponse.json({ 
          success: false, 
          error: createError.message 
        }, { status: 500 });
      }
      
      result = newUser;
      console.log('사용자 정보 생성 성공:', newUser);
    } else {
      console.log('사용자 정보 업데이트 시도:', {...userData, email: normalizedEmail});
      
      // 기존 사용자 정보 업데이트
      const { data: updatedUser, error: updateError } = await serviceSupabase
        .from('users')
        .update({
          name: userData.name || existingUser.name,
          phone: userData.phone || existingUser.phone,
          updated_at: new Date().toISOString()
        })
        .eq('email', normalizedEmail)
        .select();
        
      if (updateError) {
        console.error('사용자 정보 업데이트 오류:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: updateError.message 
        }, { status: 500 });
      }
      
      result = updatedUser;
      console.log('사용자 정보 업데이트 성공:', updatedUser);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: result 
    });
    
  } catch (error) {
    console.error('사용자 정보 생성/업데이트 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 