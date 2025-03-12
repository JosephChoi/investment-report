import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 첨부 파일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 첨부 파일 정보 조회
    const { data: attachment, error: fetchError } = await supabase
      .from('consultation_attachments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('첨부 파일 정보 조회 오류:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!attachment) {
      return NextResponse.json({ error: '첨부 파일을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 파일 경로 추출 (URL에서 경로 부분만 추출)
    const fileUrl = attachment.file_url;
    const pathMatch = fileUrl.match(/\/consultations\/(.+)$/);
    
    if (pathMatch && pathMatch[1]) {
      const filePath = `consultations/${pathMatch[1]}`;
      
      // Supabase Storage에서 파일 삭제
      const { error: storageError } = await supabase.storage
        .from('consultations')
        .remove([filePath]);

      if (storageError) {
        console.error('스토리지 파일 삭제 오류:', storageError);
        // 스토리지 삭제 실패해도 DB에서는 삭제 진행
      }
    }

    // 데이터베이스에서 첨부 파일 정보 삭제
    const { error: deleteError } = await supabase
      .from('consultation_attachments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('첨부 파일 정보 삭제 오류:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('첨부 파일 삭제 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 