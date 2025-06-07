import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * 포트폴리오 타입 목록 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // portfolio_types 테이블이 있는지 확인
    let hasPortfolioTypesTable = true;
    try {
      const { data: tableCheck, error: tableCheckError } = await serviceSupabase
        .from('portfolio_types')
        .select('id')
        .limit(1);
        
      if (tableCheckError) {
        console.warn('portfolio_types 테이블 확인 오류:', tableCheckError);
        hasPortfolioTypesTable = false;
      }
    } catch (e) {
      console.warn('portfolio_types 테이블이 존재하지 않을 수 있습니다:', e);
      hasPortfolioTypesTable = false;
    }
    
    // portfolio_types 테이블이 없는 경우 생성 시도
    if (!hasPortfolioTypesTable) {
      try {
        console.log('portfolio_types 테이블 생성 시도...');
        
        // 테이블 생성 SQL 실행 (Supabase에서는 직접 SQL 실행이 제한될 수 있음)
        const { error: createTableError } = await serviceSupabase.rpc('create_portfolio_types_table');
        
        if (createTableError) {
          console.error('portfolio_types 테이블 생성 오류:', createTableError);
          return NextResponse.json({ 
            success: false,
            error: 'portfolio_types 테이블을 생성할 수 없습니다.' 
          }, { status: 500 });
        }
        
        console.log('portfolio_types 테이블 생성 성공');
        
        // accounts 테이블에서 고유한 portfolio_type 값 가져오기
        const { data: accountsData, error: accountsError } = await serviceSupabase
          .from('accounts')
          .select('portfolio_type')
          .order('portfolio_type');
          
        if (!accountsError && accountsData && accountsData.length > 0) {
          // 중복 제거
          const uniqueTypes = [...new Set(accountsData
            .map(item => item.portfolio_type)
            .filter(Boolean))];
            
          console.log(`accounts 테이블에서 ${uniqueTypes.length}개의 고유한 포트폴리오 타입을 찾았습니다.`);
          
          // portfolio_types 테이블에 데이터 추가
          for (const typeName of uniqueTypes) {
            const { error: insertError } = await serviceSupabase
              .from('portfolio_types')
              .insert({
                name: typeName,
                description: `${typeName} 포트폴리오`
              });
              
            if (insertError) {
              console.error(`포트폴리오 타입 '${typeName}' 추가 오류:`, insertError);
            }
          }
        }
      } catch (e) {
        console.error('portfolio_types 테이블 생성 및 초기화 오류:', e);
      }
    }
    
    // portfolio_types 테이블에서 포트폴리오 타입 목록 가져오기
    const { data, error } = await serviceSupabase
      .from('portfolio_types')
              .select('id, name, description')
      .order('name');
      
    if (error) {
      console.error('포트폴리오 타입 조회 오류:', error);
      return NextResponse.json({ 
        success: false,
        error: '포트폴리오 타입 목록을 조회하는 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      console.log('portfolio_types 테이블에 데이터가 없습니다. 대체 방법 시도...');
      
      // 백업: accounts 테이블에서 고유한 포트폴리오 타입 목록 가져오기
      try {
        const { data: accountsData, error: accountsError } = await serviceSupabase
          .from('accounts')
          .select('portfolio_type')
          .order('portfolio_type');
          
        if (accountsError) {
          throw accountsError;
        }
        
        if (!accountsData || accountsData.length === 0) {
          return NextResponse.json({ 
            success: false,
            error: '포트폴리오 타입 데이터가 없습니다.' 
          }, { status: 404 });
        }
        
        // 중복 제거
        const uniqueTypes = [...new Set(accountsData
          .map(item => item.portfolio_type)
          .filter(Boolean))];
        
        return NextResponse.json({ 
          success: true, 
          data: uniqueTypes.map(name => ({ name }))
        });
      } catch (backupError) {
        console.error('대체 방법 오류:', backupError);
        return NextResponse.json({ 
          success: false,
          error: '포트폴리오 타입 데이터를 찾을 수 없습니다.' 
        }, { status: 404 });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data
    });
    
  } catch (error) {
    console.error('포트폴리오 타입 목록 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false,
      error: '데이터 조회 중 오류가 발생했습니다.',
      details: (error as Error).message 
    }, { status: 500 });
  }
} 