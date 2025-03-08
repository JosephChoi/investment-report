import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
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
    
    // 2. 계좌 데이터 가져오기
    const { data: accounts, error: accountsError } = await serviceSupabase
      .from('accounts')
      .select('*')
      .limit(20);
      
    if (accountsError) {
      console.error('계좌 정보 조회 오류:', accountsError);
      return NextResponse.json({ 
        success: false, 
        error: '계좌 정보 조회 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }
    
    // 3. contract_date 값이 있는 계좌 수 확인
    const accountsWithContractDate = accounts?.filter(account => account.contract_date);
    
    // 4. 최근 업로드된 고객 데이터 확인
    const { data: recentUploads, error: uploadsError } = await serviceSupabase
      .from('customer_uploads')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(5);
      
    if (uploadsError) {
      console.error('최근 업로드 조회 오류:', uploadsError);
    }
    
    // 5. 테이블 변경 필요 여부 확인
    let needsTableUpdate = false;
    let updateSql = '';
    
    if (!hasContractDateColumn) {
      needsTableUpdate = true;
      updateSql = `
        ALTER TABLE accounts 
        ADD COLUMN contract_date TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN accounts.contract_date IS '최초 계약일';
      `;
    }
    
    return NextResponse.json({
      success: true,
      tableStructure: {
        hasContractDateColumn,
        columns: accountColumns
      },
      accounts: {
        total: accounts?.length || 0,
        withContractDate: accountsWithContractDate?.length || 0,
        sampleAccounts: accounts?.slice(0, 5).map(account => ({
          id: account.id,
          account_number: account.account_number,
          portfolio_type: account.portfolio_type,
          contract_date: account.contract_date,
          created_at: account.created_at
        }))
      },
      recentUploads: recentUploads?.map(upload => ({
        id: upload.id,
        file_name: upload.file_name,
        uploaded_at: upload.uploaded_at,
        record_count: upload.record_count
      })),
      needsTableUpdate,
      updateSql: needsTableUpdate ? updateSql : null,
      message: hasContractDateColumn 
        ? '계약일 컬럼이 존재합니다.' 
        : '계약일 컬럼이 존재하지 않습니다. 테이블 업데이트가 필요합니다.'
    });
  } catch (error: any) {
    console.error('계약일 데이터 확인 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || '계약일 데이터 확인 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 