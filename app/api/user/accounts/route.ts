import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 사용자 계좌 정보 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 이메일 가져오기
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: '사용자 이메일이 없습니다.' }, { status: 400 });
    }
    
    // 사용자 조회
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        accounts: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: '해당 이메일의 사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        accounts: user.accounts
      }
    });
    
  } catch (error) {
    console.error('사용자 계좌 정보 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '데이터 조회 중 오류가 발생했습니다.', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 