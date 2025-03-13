import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('portfolio_types 테이블에서 포트폴리오 타입 데이터 조회 시도...');
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // portfolio_types 테이블에서 포트폴리오 타입 목록 가져오기
    const { data, error } = await serviceSupabase
      .from('portfolio_types')
      .select('id, name, description, category, risk_level')
      .order('name');
      
    if (error) {
      console.error('포트폴리오 타입 조회 오류:', error);
      throw new Error(`포트폴리오 타입 목록을 조회하는 중 오류가 발생했습니다: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.error('portfolio_types 테이블에서 포트폴리오 타입을 찾을 수 없습니다.');
      
      // 백업: accounts 테이블에서 고유한 포트폴리오 타입 목록 가져오기
      console.log('백업: accounts 테이블에서 포트폴리오 타입 데이터 조회 시도...');
      const { data: accountsData, error: accountsError } = await serviceSupabase
        .from('accounts')
        .select('portfolio_type')
        .order('portfolio_type');
        
      if (accountsError || !accountsData || accountsData.length === 0) {
        console.error('accounts 테이블에서도 포트폴리오 타입을 찾을 수 없습니다.');
        throw new Error('포트폴리오 타입 데이터가 없습니다.');
      }
      
      // 중복 제거
      const uniqueTypes = [...new Set(accountsData.map(item => item.portfolio_type))];
      console.log('accounts 테이블에서 고유한 포트폴리오 타입:', uniqueTypes);
      
      // 포트폴리오 데이터 생성 (임시 ID 사용)
      const portfolios = uniqueTypes.map((type, index) => {
        return {
          id: (index + 1).toString(),
          name: type.toString(),
          description: `${type.toString()} 유형의 포트폴리오`,
          type: type.toString()
        };
      });
      
      console.log(`accounts 테이블에서 ${portfolios.length}개의 포트폴리오 타입을 가져왔습니다.`);
      return NextResponse.json({ data: portfolios });
    }
    
    // 포트폴리오 데이터 생성
    const portfolios = data.map(item => {
      return {
        id: item.id,
        name: item.name,
        description: item.description || `${item.name} 유형의 포트폴리오`,
        type: item.name,
        category: item.category,
        risk_level: item.risk_level
      };
    });
    
    console.log(`portfolio_types 테이블에서 ${portfolios.length}개의 포트폴리오 타입을 가져왔습니다.`);
    return NextResponse.json({ data: portfolios });
  } catch (error) {
    console.error('포트폴리오 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 