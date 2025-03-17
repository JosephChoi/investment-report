import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { OverduePaymentNoticeResponse } from '@/lib/overdue-types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 안내문 ID 확인
    const noticeId = params.id;
    
    if (!noticeId) {
      return NextResponse.json(
        {
          data: null,
          error: '안내문 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }
    
    // 연체정보 안내문 조회 (서비스 역할 키 사용)
    const { data, error } = await supabaseAdmin
      .from('overdue_payment_notices')
      .select('*')
      .eq('id', noticeId)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return NextResponse.json(
        {
          data: null,
          error: '해당 ID의 안내문을 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      data: data as OverduePaymentNoticeResponse,
      error: null,
    });
  } catch (error) {
    console.error('연체정보 안내문 조회 오류:', error);
    
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : '연체정보 안내문 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    
    if (!body.content) {
      return NextResponse.json(
        {
          data: null,
          error: '안내문 내용이 필요합니다.',
        },
        { status: 400 }
      );
    }
    
    // 연체정보 안내문 수정 (서비스 역할 키 사용)
    const { data, error } = await supabaseAdmin
      .from('overdue_payment_notices')
      .update({
        content: body.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      data: data as OverduePaymentNoticeResponse,
      error: null,
    });
  } catch (error) {
    console.error('연체정보 안내문 수정 오류:', error);
    
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : '연체정보 안내문 수정 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
} 