import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { createClient } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  console.log('고객 데이터 업로드 API 시작');
  
  // 환경변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('환경 변수 확인:', {
    'URL 존재': !!supabaseUrl,
    'Service Role Key 존재': !!serviceRoleKey,
    'Service Role Key 길이': serviceRoleKey?.length
  });
  
  try {
    // 요청 헤더에서 인증 토큰 확인
    const authHeader = request.headers.get('Authorization');
    console.log('인증 헤더 존재:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('인증 헤더가 없거나 올바르지 않습니다.');
      return NextResponse.json({
        success: false,
        error: '유효한 인증 토큰이 필요합니다. 다시 로그인해주세요.'
      }, { status: 401 });
    }
    
    const tokenFromHeader = authHeader.substring(7);
    console.log('헤더에서 토큰 추출됨 (길이):', tokenFromHeader.length);
    
    // Supabase 클라이언트 생성
    const supabase = createClient();
    
    // 토큰으로 사용자 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenFromHeader);
    console.log('사용자 검증 결과:', user ? '성공' : '실패', authError ? `오류: ${authError.message}` : '오류 없음');
    
    if (authError || !user) {
      console.error('사용자 검증 실패:', authError || '사용자 정보 없음');
      return NextResponse.json({
        success: false,
        error: '인증에 실패했습니다. 다시 로그인해주세요.'
      }, { status: 401 });
    }
    
    console.log('사용자 검증 성공:', user.id);
    
    // supabaseAdmin이 제대로 초기화되었는지 확인
    if (!supabaseAdmin) {
      console.error('Supabase Admin 클라이언트가 초기화되지 않았습니다.');
      return NextResponse.json({
        success: false,
        error: '서버 구성 오류: 관리자 클라이언트를 초기화할 수 없습니다.'
      }, { status: 500 });
    }
    
    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    console.log('사용자 정보:', userData, userError ? `오류: ${userError.message}` : '오류 없음');
    
    if (userError) {
      console.error('사용자 정보 조회 오류:', userError);
      return NextResponse.json({
        success: false,
        error: `사용자 정보를 조회할 수 없습니다: ${userError.message}`
      }, { status: 500 });
    }
    
    if (!userData || userData.role !== 'admin') {
      console.error('관리자 권한이 없는 사용자:', userData?.role);
      return NextResponse.json({
        success: false,
        error: '관리자 권한이 필요합니다.'
      }, { status: 403 });
    }
    
    // 폼 데이터 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const year = formData.get('year') as string;
    const month = formData.get('month') as string;
    
    if (!file || !year || !month) {
      return NextResponse.json(
        {
          success: false,
          error: '파일, 연도, 월은 필수 입력 항목입니다.',
        },
        { status: 400 }
      );
    }
    
    console.log('고객 데이터 업로드:', { year, month, fileName: file.name, fileSize: file.size });
    
    // 파일 확장자 확인
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !['xlsx', 'xls'].includes(fileExt)) {
      return NextResponse.json(
        {
          success: false,
          error: '지원되지 않는 파일 형식입니다. Excel 파일(.xlsx, .xls)만 업로드 가능합니다.',
        },
        { status: 400 }
      );
    }
    
    // 파일 내용 읽기
    const arrayBuffer = await file.arrayBuffer();
    const workbook = xlsx.read(arrayBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: '데이터가 없거나 형식이 올바르지 않습니다. 최소한 헤더 행과 데이터 행이 필요합니다.',
        },
        { status: 400 }
      );
    }
    
    // 헤더 행과 첫 번째 데이터 행 로깅
    console.log('헤더 행:', jsonData[0]);
    console.log('첫 번째 데이터 행:', jsonData[1]);
    
    // 필수 열 확인을 위한 헤더 매핑
    const headers = jsonData[0] as string[];
    
    // 다양한 열 이름을 지원하기 위한 매핑 함수
    const findColumnIndex = (possibleNames: string[]) => {
      return headers.findIndex(header => 
        typeof header === 'string' && 
        possibleNames.some(name => header.toLowerCase().includes(name.toLowerCase()))
      );
    };
    
    // 다양한 컬럼명 형식 지원
    const emailIndex = findColumnIndex(['이메일', 'email', 'e-mail', '메일']);
    const nameIndex = findColumnIndex(['고객명', '성명', '이름', '계약자명', 'name']);
    const accountIndex = findColumnIndex(['계좌번호', '계좌', '증권번호', '계약번호', 'account']);
    const balanceIndex = findColumnIndex(['전일잔고', '잔고', '평가금액', '평가액', '금액', 'balance']);
    const portfolioIndex = findColumnIndex(['대표MP', '포트폴리오', '투자유형', '상품명', 'portfolio']);
    const phoneIndex = findColumnIndex(['연락처', '전화번호', '휴대폰', 'phone']);
    
    console.log('열 인덱스 매핑 결과:', {
      이메일: emailIndex,
      고객명: nameIndex,
      계좌번호: accountIndex,
      잔고: balanceIndex,
      포트폴리오: portfolioIndex,
      연락처: phoneIndex
    });
    
    if (emailIndex === -1 || nameIndex === -1 || accountIndex === -1 || balanceIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 열(이메일, 이름, 계좌번호, 잔액)을 찾을 수 없습니다.',
        },
        { status: 400 }
      );
    }
    
    // 데이터 처리
    const processedData = [];
    const yearMonth = `${year}-${month.padStart(2, '0')}`;
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      
      if (!row[emailIndex] || !row[nameIndex] || !row[accountIndex]) {
        console.log(`행 ${i+1} 건너뜀: 필수 데이터 누락`);
        continue;
      }
      
      const email = String(row[emailIndex]).trim();
      const name = String(row[nameIndex]).trim();
      const accountNumber = String(row[accountIndex]).trim();
      const balance = parseFloat(String(row[balanceIndex]).replace(/,/g, '')) || 0;
      const portfolioType = portfolioIndex !== -1 && row[portfolioIndex] ? String(row[portfolioIndex]).trim() : 'Unknown';
      const phone = phoneIndex !== -1 && row[phoneIndex] ? String(row[phoneIndex]).trim() : null;
      
      // 필수 데이터 확인
      if (!email || !accountNumber || isNaN(balance)) {
        console.log(`행 ${i+1} 건너뜀: 필수 데이터 형식 오류`);
        continue;
      }
      
      processedData.push({
        email,
        name,
        account_number: accountNumber,
        portfolio_type: portfolioType,
        phone,
        balance,
        year_month: yearMonth,
        created_by: user.id,
        updated_by: user.id,
      });
    }
    
    if (processedData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '처리할 수 있는 유효한 데이터가 없습니다.',
        },
        { status: 400 }
      );
    }
    
    console.log(`처리된 데이터 수: ${processedData.length}`);
    
    try {
      // 사용자 및 계좌 정보 업데이트
      for (const item of processedData) {
        // 1. 사용자 정보 저장/업데이트
        console.log('사용자 정보 저장 시도:', { email: item.email, name: item.name });
        
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .upsert({
            email: item.email,
            name: item.name,
            phone: item.phone,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          })
          .select('id');
          
        if (userError) {
          console.error('사용자 정보 저장 오류:', userError);
          continue;
        }
        
        let userId;
        
        if (userData && userData.length > 0) {
          userId = userData[0].id;
        } else {
          // ID를 직접 조회
          const { data: fetchedUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', item.email)
            .single();
            
          if (fetchedUser) {
            userId = fetchedUser.id;
          } else {
            console.error('사용자 정보를 찾을 수 없습니다:', item.email);
            continue;
          }
        }
        
        console.log('사용자 정보 저장 성공:', { userId, email: item.email });
        
        // 2. 계좌 정보 저장/업데이트
        console.log('계좌 정보 저장 시도:', { 
          userId, 
          accountNumber: item.account_number, 
          portfolioType: item.portfolio_type 
        });
        
        const { data: accountData, error: accountError } = await supabaseAdmin
          .from('accounts')
          .upsert({
            user_id: userId,
            account_number: item.account_number,
            portfolio_type: item.portfolio_type,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'account_number'
          })
          .select('id');
          
        if (accountError) {
          console.error('계좌 정보 저장 오류:', accountError);
          continue;
        }
        
        let accountId;
        
        if (accountData && accountData.length > 0) {
          accountId = accountData[0].id;
        } else {
          // ID를 직접 조회
          const { data: fetchedAccount } = await supabaseAdmin
            .from('accounts')
            .select('id')
            .eq('account_number', item.account_number)
            .single();
            
          if (fetchedAccount) {
            accountId = fetchedAccount.id;
          } else {
            console.error('계좌 정보를 찾을 수 없습니다:', item.account_number);
            continue;
          }
        }
        
        console.log('계좌 정보 저장 성공:', { accountId, accountNumber: item.account_number });
        
        // 3. 잔고 정보 저장
        console.log('잔고 정보 저장 시도:', { accountId, yearMonth, balance: item.balance });
        
        const { error: balanceError } = await supabaseAdmin
          .from('balance_records')
          .upsert({
            account_id: accountId,
            year_month: yearMonth,
            balance: item.balance,
            record_date: new Date().toISOString()
          }, {
            onConflict: 'account_id, year_month'
          });
          
        if (balanceError) {
          console.error('잔고 정보 저장 오류:', balanceError);
          continue;
        }
        
        console.log('잔고 정보 저장 성공:', { accountId, yearMonth, balance: item.balance });
      }
      
      // 기존 데이터 삭제 작업은 제거 (이미 upsert로 처리됨)
    } catch (error) {
      console.error('데이터 업데이트 중 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : '데이터 업데이트 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        inserted_count: processedData.length,
      },
    });
  } catch (error) {
    console.error('고객 데이터 업로드 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '고객 데이터 업로드 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
} 