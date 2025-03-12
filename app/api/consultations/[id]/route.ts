import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

// 특정 상담 내역 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log('Fetching consultation details for ID:', id);

    // 서비스 역할 키를 사용하는 클라이언트로 변경 (RLS 우회)
    const serviceSupabase = getServiceSupabase();

    // 상담 내역 기본 정보 조회
    const { data: consultationData, error: consultationError } = await serviceSupabase
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (consultationError) {
      console.error('상담 내역 조회 오류:', consultationError);
      return NextResponse.json({ error: consultationError.message }, { status: 500 });
    }

    if (!consultationData) {
      return NextResponse.json({ error: '상담 내역을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 사용자 정보 조회
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id, name, email')
      .eq('id', consultationData.user_id)
      .single();

    if (userError) {
      console.error(`사용자 정보 조회 오류 (user_id: ${consultationData.user_id}):`, userError);
    }

    // 첨부 파일 정보 조회
    const { data: attachmentsData, error: attachmentsError } = await serviceSupabase
      .from('consultation_attachments')
      .select('*')
      .eq('consultation_id', id);

    if (attachmentsError) {
      console.error(`첨부 파일 조회 오류 (consultation_id: ${id}):`, attachmentsError);
    }

    // 결과 조합
    const result = {
      ...consultationData,
      users: userData || null,
      consultation_attachments: attachmentsData || []
    };

    console.log('Successfully fetched consultation details');
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('상담 내역 상세 조회 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 상담 내역 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { user_id, title, content, consultation_date } = body;

    // 필수 필드 검증
    if (!user_id || !title || !content || !consultation_date) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 서비스 역할 키를 사용하는 클라이언트로 변경 (RLS 우회)
    const serviceSupabase = getServiceSupabase();

    // 상담 내역 수정
    const { data, error } = await serviceSupabase
      .from('consultations')
      .update({
        user_id,
        title,
        content,
        consultation_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('상담 내역 수정 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (error) {
    console.error('상담 내역 수정 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 상담 내역 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 서비스 역할 키를 사용하는 클라이언트로 변경 (RLS 우회)
    const serviceSupabase = getServiceSupabase();

    // 첨부 파일 삭제
    const { data: attachments, error: fetchError } = await serviceSupabase
      .from('consultation_attachments')
      .select('file_name')
      .eq('consultation_id', id);

    if (fetchError) {
      console.error('첨부 파일 조회 오류:', fetchError);
    } else if (attachments && attachments.length > 0) {
      // Storage에서 파일 삭제
      for (const attachment of attachments) {
        const { error: storageError } = await serviceSupabase.storage
          .from('consultations')
          .remove([attachment.file_name]);
        
        if (storageError) {
          console.error('첨부 파일 삭제 오류:', storageError);
        }
      }

      // DB에서 첨부 파일 정보 삭제
      const { error: deleteAttachmentError } = await serviceSupabase
        .from('consultation_attachments')
        .delete()
        .eq('consultation_id', id);
      
      if (deleteAttachmentError) {
        console.error('첨부 파일 정보 삭제 오류:', deleteAttachmentError);
      }
    }

    // 상담 내역 삭제
    const { error } = await serviceSupabase
      .from('consultations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('상담 내역 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('상담 내역 삭제 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 