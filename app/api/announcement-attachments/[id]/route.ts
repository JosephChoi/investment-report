import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 첨부 파일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // 첨부 파일 정보 조회
    const { data: attachment, error: fetchError } = await supabase
      .from('announcement_attachments')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!attachment) {
      return NextResponse.json({ error: '첨부 파일을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 파일 경로 추출 (URL에서 경로 추출)
    const fileUrl = attachment.file_url;
    const filePathMatch = fileUrl.match(/announcements\/[^?]+/);
    
    if (filePathMatch) {
      const filePath = filePathMatch[0];
      
      // Supabase Storage에서 파일 삭제
      const { error: storageError } = await supabase
        .storage
        .from('announcements')
        .remove([filePath]);
      
      if (storageError) {
        console.error('스토리지 파일 삭제 중 오류 발생:', storageError);
        // 스토리지 삭제 실패해도 DB에서는 삭제 진행
      }
    }
    
    // 데이터베이스에서 첨부 파일 정보 삭제
    const { error } = await supabase
      .from('announcement_attachments')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('첨부 파일 삭제 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 