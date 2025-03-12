import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 특정 상담 내역의 첨부 파일 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { consultationId: string } }
) {
  try {
    const consultationId = params.consultationId;

    const { data, error } = await supabase
      .from('consultation_attachments')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('첨부 파일 목록 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('첨부 파일 목록 조회 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 