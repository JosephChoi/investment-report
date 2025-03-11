import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 요청 본문 파싱
    const body = await request.json();
    const { year_month, content, comment_date } = body;
    
    console.log('월간 코멘트 저장 API 호출:', { year_month, content });
    
    if (!year_month || !content) {
      return NextResponse.json({ 
        success: false, 
        error: '연월과 내용이 필요합니다.' 
      }, { status: 400 });
    }
    
    // 월간 코멘트 저장
    const { data, error } = await serviceSupabase
      .from('monthly_comments')
      .upsert({
        year_month,
        content,
        comment_date: comment_date || new Date().toISOString()
      }, {
        onConflict: 'year_month'
      })
      .select();
      
    if (error) {
      console.error('월간 코멘트 저장 오류:', error);
      return NextResponse.json({ 
        success: false, 
        error: `월간 코멘트 저장 오류: ${error.message}` 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data 
    });
    
  } catch (error: any) {
    console.error('월간 코멘트 저장 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false, 
      error: `데이터 처리 중 오류가 발생했습니다: ${error.message}` 
    }, { status: 500 });
  }
} 