import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyComments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * 월간 코멘트 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 날짜 가져오기
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    let comment;
    
    if (date) {
      // 특정 날짜의 코멘트 조회
      const targetDate = new Date(date);
      comment = await db.query.monthlyComments.findFirst({
        where: eq(monthlyComments.comment_date, targetDate)
      });
    } else {
      // 최신 코멘트 조회
      comment = await db.query.monthlyComments.findFirst({
        orderBy: (comments, { desc }) => [desc(comments.comment_date)]
      });
    }
    
    if (!comment) {
      return NextResponse.json({ 
        success: false, 
        error: '해당 날짜의 월간 코멘트를 찾을 수 없습니다.' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: comment
    });
    
  } catch (error) {
    console.error('월간 코멘트 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '데이터 조회 중 오류가 발생했습니다.', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 