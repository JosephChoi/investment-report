import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 첨부 파일 업로드
export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 토큰으로 세션 설정
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 관리자 권한 확인
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }
    
    // multipart/form-data 파싱
    const formData = await request.formData();
    const announcement_id = formData.get('announcement_id') as string;
    const file = formData.get('file') as File;
    
    if (!announcement_id || !file) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    
    // 파일 유효성 검사
    if (file.size > 10 * 1024 * 1024) { // 10MB 제한
      return NextResponse.json({ error: '파일 크기는 10MB를 초과할 수 없습니다.' }, { status: 400 });
    }
    
    // 허용된 파일 타입 검사
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '지원되지 않는 파일 형식입니다.' }, { status: 400 });
    }
    
    // 파일 이름 생성
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `announcements/${announcement_id}/${fileName}`;
    
    // Supabase Storage에 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('announcements')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    // 파일 URL 생성
    const { data: urlData } = await supabase
      .storage
      .from('announcements')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1년 유효
    
    const fileUrl = urlData?.signedUrl || '';
    
    // 첨부 파일 정보 데이터베이스에 저장
    const { data, error } = await supabase
      .from('announcement_attachments')
      .insert({
        announcement_id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: fileUrl
      })
      .select()
      .single();
    
    if (error) {
      // 업로드된 파일 삭제
      await supabase
        .storage
        .from('announcements')
        .remove([filePath]);
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('첨부 파일 업로드 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 