import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portfolioReports } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * 포트폴리오 리포트 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 포트폴리오 유형과 날짜 가져오기
    const { searchParams } = new URL(request.url);
    const portfolioType = searchParams.get('portfolioType');
    const date = searchParams.get('date');
    
    if (!portfolioType) {
      return NextResponse.json({ error: '포트폴리오 유형이 없습니다.' }, { status: 400 });
    }
    
    let report;
    
    if (date) {
      // 특정 날짜의 리포트 조회
      const targetDate = new Date(date);
      report = await db.query.portfolioReports.findFirst({
        where: (reports, { and }) => and(
          eq(reports.portfolio_type, portfolioType),
          eq(reports.report_date, targetDate)
        )
      });
    } else {
      // 최신 리포트 조회
      report = await db.query.portfolioReports.findFirst({
        where: eq(portfolioReports.portfolio_type, portfolioType),
        orderBy: (reports, { desc }) => [desc(reports.report_date)]
      });
    }
    
    if (!report) {
      return NextResponse.json({ 
        success: false, 
        error: '해당 포트폴리오 유형의 리포트를 찾을 수 없습니다.' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: report
    });
    
  } catch (error) {
    console.error('포트폴리오 리포트 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '데이터 조회 중 오류가 발생했습니다.', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 