import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 일반 클라이언트와 서비스 역할 클라이언트 모두 테스트
    const regularClient = supabase;
    const serviceClient = getServiceSupabase();
    
    const results = {
      regularClient: await testClient(regularClient, '일반 클라이언트'),
      serviceClient: await testClient(serviceClient, '서비스 역할 클라이언트')
    };
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('테스트 중 오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '알 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

async function testClient(client: any, clientType: string) {
  try {
    // 1. 직접 테이블 목록 확인 (하드코딩)
    const tablesToCheck = ['users', 'accounts', 'balance_records', 'monthly_comments', 'portfolio_reports'];
    const tableDetails = [];
    
    for (const tableName of tablesToCheck) {
      try {
        // 테이블에서 데이터 샘플 가져오기
        const { data: sampleData, error: sampleError } = await client
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (sampleError) {
          console.error(`${tableName} 샘플 데이터 가져오기 오류:`, sampleError);
          tableDetails.push({
            tableName,
            exists: false,
            error: sampleError.message
          });
        } else {
          tableDetails.push({
            tableName,
            exists: true,
            sampleData: sampleData || []
          });
        }
      } catch (tableError: any) {
        console.error(`${tableName} 테이블 테스트 오류:`, tableError);
        tableDetails.push({
          tableName,
          exists: false,
          error: tableError.message
        });
      }
    }
    
    // 2. 테스트 데이터 삽입 시도
    const testTableName = 'monthly_comments';
    const testData = {
      year_month: '2024-03',
      content: `${clientType} 테스트 데이터`,
      comment_date: new Date().toISOString()
    };
    
    let insertResult;
    try {
      const { data: insertData, error: insertError } = await client
        .from(testTableName)
        .upsert(testData)
        .select();
        
      insertResult = {
        success: !insertError,
        data: insertData,
        error: insertError ? insertError.message : null
      };
    } catch (insertErr: any) {
      insertResult = {
        success: false,
        error: insertErr.message
      };
    }
    
    return {
      success: true,
      clientType,
      tableDetails,
      testInsert: insertResult
    };
  } catch (error: any) {
    return {
      success: false,
      clientType,
      error: error.message
    };
  }
} 