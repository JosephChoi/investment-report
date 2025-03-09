import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * 월간리포트 테스트 데이터 생성 API
 */
export async function GET(request: NextRequest) {
  try {
    // 현재 날짜 기준으로 최근 6개월 데이터 생성
    const currentDate = new Date();
    const reports = [];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const year_month = `${year}-${month.toString().padStart(2, '0')}`;
      
      reports.push({
        year_month: year_month,
        title: `${year}년 ${month}월 투자 리포트`,
        description: '월간 투자 현황 및 포트폴리오 리포트입니다.',
        image_url: `/images/monthly-report-${month.toString().padStart(2, '0')}.jpg`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // 월간 리포트 데이터 저장
    const { data: reportData, error: reportError } = await supabase
      .from('monthly_reports')
      .upsert(reports, { onConflict: 'year_month' })
      .select();
      
    if (reportError) {
      console.error('월간 리포트 데이터 저장 오류:', reportError);
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }
    
    // 월간 코멘트 데이터 생성
    const comments = reports.map(report => ({
      year_month: report.year_month,
      content: `${report.year_month.split('-')[0]}년 ${report.year_month.split('-')[1]}월 시장은 전반적으로 상승세를 보였습니다. 특히 기술주와 금융주의 강세가 두드러졌으며, 글로벌 경제 회복 기대감으로 투자심리가 개선되었습니다. 다음 달에는 중앙은행의 통화정책 결정에 주목할 필요가 있으며, 인플레이션 지표의 변화에 따라 시장 변동성이 커질 수 있습니다.`,
      comment_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // 월간 코멘트 데이터 저장
    const { data: commentData, error: commentError } = await supabase
      .from('monthly_comments')
      .upsert(comments, { onConflict: 'year_month' })
      .select();
      
    if (commentError) {
      console.error('월간 코멘트 데이터 저장 오류:', commentError);
      return NextResponse.json({ error: commentError.message }, { status: 500 });
    }
    
    // 포트폴리오 타입 목록
    const portfolioTypes = ['안정형', '성장형', '공격형', 'EMP', 'IRP', 'ISA'];
    
    // 포트폴리오 리포트 데이터 생성
    const portfolioReports = [];
    
    for (const report of reports) {
      for (const type of portfolioTypes) {
        portfolioReports.push({
          year_month: report.year_month,
          portfolio_type: type,
          report_url: `/images/portfolio-report-${type}.jpg`,
          report_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // 포트폴리오 리포트 데이터 저장
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolio_reports')
      .upsert(portfolioReports, { onConflict: 'year_month,portfolio_type' })
      .select();
      
    if (portfolioError) {
      console.error('포트폴리오 리포트 데이터 저장 오류:', portfolioError);
      return NextResponse.json({ error: portfolioError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '월간리포트 테스트 데이터가 성공적으로 생성되었습니다.',
      data: {
        reports: reportData?.length || 0,
        comments: commentData?.length || 0,
        portfolioReports: portfolioData?.length || 0
      }
    });
    
  } catch (error: any) {
    console.error('월간리포트 테스트 데이터 생성 오류:', error);
    return NextResponse.json({
      error: '데이터 생성 중 오류가 발생했습니다.',
      details: error.message
    }, { status: 500 });
  }
} 