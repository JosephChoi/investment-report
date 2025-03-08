import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts, balanceRecords } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * 계좌 잔고 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 계좌번호 가져오기
    const { searchParams } = new URL(request.url);
    const accountNumber = searchParams.get('accountNumber');
    
    if (!accountNumber) {
      return NextResponse.json({ error: '계좌번호가 없습니다.' }, { status: 400 });
    }
    
    // 계좌 조회
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.account_number, accountNumber)
    });
    
    if (!account) {
      return NextResponse.json({ error: '해당 계좌번호의 계좌를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 잔고 기록 조회
    const balances = await db.query.balanceRecords.findMany({
      where: eq(balanceRecords.account_id, account.id),
      orderBy: (balanceRecords, { asc }) => [asc(balanceRecords.record_date)]
    });
    
    // 잔고 변화 데이터 포맷팅
    const balanceData = balances.map(record => ({
      id: record.id,
      date: record.record_date.toISOString().split('T')[0],
      balance: Number(record.balance)
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: {
        account: {
          id: account.id,
          account_number: account.account_number,
          portfolio_type: account.portfolio_type
        },
        balances: balanceData
      }
    });
    
  } catch (error) {
    console.error('계좌 잔고 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '데이터 조회 중 오류가 발생했습니다.', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 