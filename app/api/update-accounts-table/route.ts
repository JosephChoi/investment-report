import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 1. 계좌 테이블 구조 확인
    const { data: accountColumns, error: columnsError } = await serviceSupabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'accounts');
      
    if (columnsError) {
      console.error('테이블 구조 조회 오류:', columnsError);
      return NextResponse.json({ 
        success: false, 
        error: '테이블 구조 조회 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }
    
    // contract_date 컬럼이 있는지 확인
    const hasContractDateColumn = accountColumns?.some(
      column => column.column_name === 'contract_date'
    );
    
    // 이미 컬럼이 있으면 업데이트 필요 없음
    if (hasContractDateColumn) {
      return NextResponse.json({
        success: true,
        message: '계약일 컬럼이 이미 존재합니다. 업데이트가 필요하지 않습니다.',
        updated: false
      });
    }
    
    // 2. 테이블 업데이트 실행
    const { data, error } = await serviceSupabase.rpc('execute_sql', {
      sql_query: `
        ALTER TABLE accounts 
        ADD COLUMN contract_date TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN accounts.contract_date IS '최초 계약일';
      `
    });
    
    if (error) {
      console.error('테이블 업데이트 오류:', error);
      return NextResponse.json({ 
        success: false, 
        error: `테이블 업데이트 중 오류가 발생했습니다: ${error.message}` 
      }, { status: 500 });
    }
    
    // 3. 업데이트 후 테이블 구조 다시 확인
    const { data: updatedColumns, error: updatedColumnsError } = await serviceSupabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'accounts');
      
    if (updatedColumnsError) {
      console.error('업데이트 후 테이블 구조 조회 오류:', updatedColumnsError);
    }
    
    // 업데이트 후 contract_date 컬럼이 있는지 확인
    const hasUpdatedColumn = updatedColumns?.some(
      column => column.column_name === 'contract_date'
    );
    
    return NextResponse.json({
      success: true,
      message: hasUpdatedColumn 
        ? '계약일 컬럼이 성공적으로 추가되었습니다.' 
        : '계약일 컬럼 추가가 실패했습니다.',
      updated: hasUpdatedColumn,
      tableStructure: {
        before: accountColumns,
        after: updatedColumns
      }
    });
  } catch (error: any) {
    console.error('테이블 업데이트 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || '테이블 업데이트 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 