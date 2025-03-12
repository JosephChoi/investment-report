import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

// 첨부 파일 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('consultation_id');

    if (!consultationId) {
      return NextResponse.json(
        { error: '상담 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 서비스 역할 키를 사용하는 클라이언트로 변경 (RLS 우회)
    const serviceSupabase = getServiceSupabase();

    // 첨부 파일 목록 조회
    const { data, error } = await serviceSupabase
      .from('consultation_attachments')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('id', { ascending: false });

    if (error) {
      console.error('첨부 파일 목록 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 이미 file_url 필드가 있으므로 그대로 사용
    const filesWithUrls = data.map(file => ({
      ...file,
      url: file.file_url // 이미 저장된 URL 사용
    }));

    return NextResponse.json({ data: filesWithUrls });
  } catch (error) {
    console.error('첨부 파일 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 첨부 파일 다운로드 URL 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file_path } = body;

    if (!file_path) {
      return NextResponse.json(
        { error: '파일 경로가 필요합니다.' },
        { status: 400 }
      );
    }

    // 서비스 역할 키를 사용하는 클라이언트로 변경 (RLS 우회)
    const serviceSupabase = getServiceSupabase();

    // 다운로드 URL 생성 - 버킷 이름을 'consultations'로 변경
    const { data, error } = await serviceSupabase.storage
      .from('consultations')
      .createSignedUrl(file_path, 60 * 5); // 5분 유효한 URL

    if (error) {
      console.error('다운로드 URL 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error('첨부 파일 다운로드 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 