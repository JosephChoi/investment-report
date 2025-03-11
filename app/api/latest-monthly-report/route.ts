import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 최신 월간 리포트 정보 가져오기
    const { data, error } = await serviceSupabase
      .from('monthly_reports')
      .select('year_month')
      .order('year_month', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('최신 월간 리포트 정보 가져오기 오류:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    // 월간 리포트 정보가 없는 경우
    if (!data || data.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: '등록된 월간 리포트 정보가 없습니다.' 
      });
    }
    
    return NextResponse.json({
      success: true,
      data: data[0],
      message: '최신 월간 리포트 정보를 성공적으로 가져왔습니다.'
    });
  } catch (error: any) {
    console.error('최신 월간 리포트 정보 가져오기 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || '최신 월간 리포트 정보를 가져오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 