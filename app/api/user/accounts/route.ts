import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * 사용자 계좌 정보 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 이메일 또는 사용자 ID 가져오기
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');
    
    if (!email && !userId) {
      return NextResponse.json({ 
        success: false,
        error: '사용자 이메일 또는 ID가 필요합니다.' 
      }, { status: 400 });
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    let userData: { id: string; email: string; name?: string; phone?: string } | null = null;
    
    // 이메일로 사용자 조회 (이메일이 제공된 경우)
    if (email) {
      const { data: userByEmail, error: userError } = await serviceSupabase
        .from('users')
        .select('id, email, name, phone')
        .eq('email', email)
        .single();
        
      if (userError) {
        console.error('이메일로 사용자 조회 오류:', userError);
        return NextResponse.json({ 
          success: false,
          error: '해당 이메일의 사용자를 찾을 수 없습니다.' 
        }, { status: 404 });
      }
      
      userData = userByEmail;
    } else if (userId) {
      // 사용자 ID로 사용자 조회 (ID가 제공된 경우)
      const { data: userById, error: userError } = await serviceSupabase
        .from('users')
        .select('id, email, name, phone')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('ID로 사용자 조회 오류:', userError);
        return NextResponse.json({ 
          success: false,
          error: '해당 ID의 사용자를 찾을 수 없습니다.' 
        }, { status: 404 });
      }
      
      userData = userById;
    }
    
    // userData가 null인 경우 처리
    if (!userData) {
      return NextResponse.json({ 
        success: false,
        error: '사용자 정보를 찾을 수 없습니다.' 
      }, { status: 404 });
    }
    
    // 사용자 ID로 계좌 정보 조회
    const { data: accountsData, error: accountsError } = await serviceSupabase
      .from('accounts')
      .select('*')
      .eq('user_id', userData.id);
      
    if (accountsError) {
      console.error('계좌 정보 조회 오류:', accountsError);
      return NextResponse.json({ 
        success: false,
        error: '계좌 정보를 조회하는 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }
    
    console.log(`사용자 ID ${userData.id}의 계좌 정보 조회 결과:`, accountsData);
    
    // 계좌 정보에 portfolio_type_id가 없는 경우 portfolio_type으로 ID 조회
    if (accountsData && accountsData.length > 0) {
      const accountsWithPortfolioTypeId = await Promise.all(accountsData.map(async (account) => {
        // portfolio_type_id가 이미 있으면 그대로 반환
        if (account.portfolio_type_id) {
          return account;
        }
        
        // portfolio_type이 있으면 해당 이름으로 ID 조회
        if (account.portfolio_type) {
          const { data: portfolioTypeData, error: portfolioTypeError } = await serviceSupabase
            .from('portfolio_types')
            .select('id')
            .eq('name', account.portfolio_type)
            .single();
            
          if (!portfolioTypeError && portfolioTypeData) {
            console.log(`계좌 ${account.id}의 portfolio_type_id를 ${portfolioTypeData.id}로 업데이트합니다.`);
            
            // 계좌 정보 업데이트
            const { error: updateError } = await serviceSupabase
              .from('accounts')
              .update({ portfolio_type_id: portfolioTypeData.id })
              .eq('id', account.id);
              
            if (updateError) {
              console.error('계좌 업데이트 오류:', updateError);
            } else {
              // 업데이트된 정보 반환
              return { ...account, portfolio_type_id: portfolioTypeData.id };
            }
          }
        }
        
        return account;
      }));
      
      return NextResponse.json({ 
        success: true, 
        data: {
          user: userData,
          accounts: accountsWithPortfolioTypeId
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        user: userData,
        accounts: accountsData
      }
    });
    
  } catch (error) {
    console.error('사용자 계좌 정보 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false,
      error: '데이터 조회 중 오류가 발생했습니다.',
      details: (error as Error).message 
    }, { status: 500 });
  }
} 