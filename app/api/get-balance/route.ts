import { getServiceSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: '계좌 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 계좌 잔고 데이터 가져오기
    const { data: balanceData, error } = await supabase
      .from('account_balances')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: true });

    if (error) {
      console.error('잔고 데이터 조회 오류:', error);
      return NextResponse.json(
        { success: false, message: '잔고 데이터를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 가상 잔고 데이터 가져오기
    const { data: virtualBalanceData, error: virtualError } = await supabase
      .from('virtual_balances')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: true });

    if (virtualError) {
      console.error('가상 잔고 데이터 조회 오류:', virtualError);
      return NextResponse.json(
        { success: false, message: '가상 잔고 데이터를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 데이터 결합
    const combinedData = {
      balances: balanceData || [],
      virtualBalances: virtualBalanceData || []
    };

    return NextResponse.json(
      { success: true, data: combinedData },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('잔고 API 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 