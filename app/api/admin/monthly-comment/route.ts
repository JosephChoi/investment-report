import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyComments } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 월간 코멘트 목록 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 날짜 가져오기
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    // 날짜가 있으면 해당 날짜의 코멘트만 조회, 없으면 전체 조회
    let comments;
    if (date) {
      const targetDate = new Date(date);
      comments = await db.query.monthlyComments.findMany({
        where: eq(monthlyComments.comment_date, targetDate),
        orderBy: (comments, { desc }) => [desc(comments.comment_date)]
      });
    } else {
      comments = await db.query.monthlyComments.findMany({
        orderBy: (comments, { desc }) => [desc(comments.comment_date)]
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: comments
    });
    
  } catch (error) {
    console.error('월간 코멘트 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '데이터 조회 중 오류가 발생했습니다.', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

/**
 * 월간 코멘트 등록 API
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { content, comment_date } = body;
    
    // 필수 필드 확인
    if (!content) {
      return NextResponse.json({ error: '코멘트 내용이 없습니다.' }, { status: 400 });
    }
    
    if (!comment_date) {
      return NextResponse.json({ error: '코멘트 날짜가 없습니다.' }, { status: 400 });
    }
    
    // 데이터베이스에 코멘트 저장
    const [comment] = await db.insert(monthlyComments).values({
      content,
      comment_date: new Date(comment_date)
    }).returning();
    
    return NextResponse.json({ 
      success: true, 
      message: '월간 코멘트가 성공적으로 등록되었습니다.',
      data: comment
    });
    
  } catch (error) {
    console.error('월간 코멘트 등록 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '데이터 처리 중 오류가 발생했습니다.', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

/**
 * 월간 코멘트 수정 API
 */
export async function PUT(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { id, content, comment_date } = body;
    
    // 필수 필드 확인
    if (!id) {
      return NextResponse.json({ error: '코멘트 ID가 없습니다.' }, { status: 400 });
    }
    
    if (!content) {
      return NextResponse.json({ error: '코멘트 내용이 없습니다.' }, { status: 400 });
    }
    
    if (!comment_date) {
      return NextResponse.json({ error: '코멘트 날짜가 없습니다.' }, { status: 400 });
    }
    
    // 데이터베이스에서 코멘트 수정
    const [updatedComment] = await db.update(monthlyComments)
      .set({
        content,
        comment_date: new Date(comment_date),
        updated_at: new Date()
      })
      .where(eq(monthlyComments.id, id))
      .returning();
    
    if (!updatedComment) {
      return NextResponse.json({ error: '해당 ID의 코멘트를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '월간 코멘트가 성공적으로 수정되었습니다.',
      data: updatedComment
    });
    
  } catch (error) {
    console.error('월간 코멘트 수정 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '데이터 처리 중 오류가 발생했습니다.', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

/**
 * 월간 코멘트 삭제 API
 */
export async function DELETE(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 ID 가져오기
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '코멘트 ID가 없습니다.' }, { status: 400 });
    }
    
    // 데이터베이스에서 코멘트 삭제
    const [deletedComment] = await db.delete(monthlyComments)
      .where(eq(monthlyComments.id, id))
      .returning();
    
    if (!deletedComment) {
      return NextResponse.json({ error: '해당 ID의 코멘트를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '월간 코멘트가 성공적으로 삭제되었습니다.',
      data: deletedComment
    });
    
  } catch (error) {
    console.error('월간 코멘트 삭제 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '데이터 처리 중 오류가 발생했습니다.', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 