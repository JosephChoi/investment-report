import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // URL에서 이메일 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: '이메일이 제공되지 않았습니다.' }, { status: 400 });
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 사용자 테이블에서 이메일로 고객 정보 확인
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (userError && userError.code !== 'PGRST116') { // PGRST116: 결과가 없음
      console.error('사용자 정보 조회 오류:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    
    // 이미 가입된 사용자인지 확인
    const { data: authUser } = await serviceSupabase.auth.admin.listUsers();
    const existingUser = authUser.users.find(user => user.email === email);
    
    if (existingUser) {
      return NextResponse.json({ 
        exists: true, 
        customer: userData,
        isRegistered: true,
        message: '이미 가입된 사용자입니다. 로그인해주세요.'
      });
    }
    
    // 사용자 정보가 있으면 계좌 정보도 함께 가져오기
    if (userData) {
      const { data: accountsData, error: accountsError } = await serviceSupabase
        .from('accounts')
        .select('*')
        .eq('user_id', userData.id);
        
      if (accountsError) {
        console.error('계좌 정보 조회 오류:', accountsError);
      }
      
      const customerInfo = {
        ...userData,
        accounts: accountsData || []
      };
      
      return NextResponse.json({ 
        exists: true, 
        customer: customerInfo,
        isRegistered: false
      });
    }
    
    // 사용자 정보가 없으면 최신 업로드된 고객 데이터에서 확인
    // 이 부분은 고객 데이터 업로드 방식에 따라 달라질 수 있음
    const { data: uploadedCustomers, error: uploadError } = await serviceSupabase
      .from('customer_uploads')
      .select('*')
      .eq('email', email)
      .order('uploaded_at', { ascending: false })
      .limit(1);
      
    if (uploadError) {
      console.error('업로드된 고객 정보 조회 오류:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    if (uploadedCustomers && uploadedCustomers.length > 0) {
      return NextResponse.json({ 
        exists: true, 
        customer: uploadedCustomers[0],
        isRegistered: false
      });
    }
    
    // 마지막으로 엑셀 업로드 시 사용된 이메일 확인
    // 이 부분은 엑셀 업로드 방식에 따라 달라질 수 있음
    const { data: excelData, error: excelError } = await serviceSupabase.rpc('find_customer_by_email', { 
      customer_email: email 
    });
    
    if (excelError) {
      console.error('엑셀 데이터 조회 오류:', excelError);
      return NextResponse.json({ error: excelError.message }, { status: 500 });
    }
    
    if (excelData && excelData.length > 0) {
      return NextResponse.json({ 
        exists: true, 
        customer: excelData[0],
        isRegistered: false
      });
    }
    
    // 모든 확인 결과 고객 정보가 없음
    return NextResponse.json({ 
      exists: false, 
      message: '등록된 고객 정보가 없습니다. 관리자에게 문의하세요.' 
    });
    
  } catch (error: any) {
    console.error('고객 이메일 확인 오류:', error);
    return NextResponse.json(
      { error: error.message || '고객 이메일 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 