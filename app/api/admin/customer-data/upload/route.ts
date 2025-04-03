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
    
    console.log('Excel 데이터 파싱 전 원본 타입:', {
      firstRowType: Array.isArray(jsonData[0]) ? '배열' : typeof jsonData[0],
      secondRowType: Array.isArray(jsonData[1]) ? '배열' : typeof jsonData[1]
    });
    
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
    
    console.log('첫 번째 행의 모든 헤더 목록:', headers);
    
    // 다양한 컬럼명 형식 지원
    const emailIndex = findColumnIndex(['이메일', 'email', 'e-mail', '메일']);
    const nameIndex = findColumnIndex(['고객명', '성명', '이름', '계약자명', 'name']);
    let contractNumberIndex = findColumnIndex(['계약번호', '증권번호']);
    let accountNumberIndex = findColumnIndex(['계좌번호', 'account', '계좌']);
    let balanceIndex = findColumnIndex(['전일잔고', '잔고', '평가금액', '평가액', '금액', 'balance']);
    const portfolioIndex = findColumnIndex(['대표MP', '포트폴리오', '투자유형', '상품명', 'portfolio']);
    const phoneIndex = findColumnIndex(['연락처', '전화번호', '휴대폰', 'phone']);
    let contractDateIndex = findColumnIndex(['계약일', '가입일']);
    
    // 각 인덱스를 로그로 출력
    console.log('찾은 열 인덱스:', {
      이메일: emailIndex,
      고객명: nameIndex,
      계약번호: contractNumberIndex,
      계좌번호: accountNumberIndex,
      잔고: balanceIndex,
      포트폴리오: portfolioIndex,
      연락처: phoneIndex,
      계약일: contractDateIndex
    });
    
    // 열 번호로 직접 지정할 수 있는 예외 처리
    // 특정 열에 대한 인덱스가 없으면 알려진 열 번호 사용
    if (contractNumberIndex === -1) {
      // D열 (인덱스로는 3)
      contractNumberIndex = 3;
      console.log('계약번호 열을 찾을 수 없어 D열(인덱스 3)을 사용합니다.');
    }
    
    if (accountNumberIndex === -1) {
      // F열 (인덱스로는 5)
      accountNumberIndex = 5;
      console.log('계좌번호 열을 찾을 수 없어 F열(인덱스 5)을 사용합니다.');
    }
    
    if (balanceIndex === -1) {
      // Q열 (인덱스로는 16)
      balanceIndex = 16;
      console.log('잔고 열을 찾을 수 없어 Q열(인덱스 16)을 사용합니다.');
    }
    
    // 엑셀 데이터 구조 디버깅 - 첫 3개 행의 Q열 데이터 확인
    console.log('첫 번째 행 데이터:', jsonData[0]);
    console.log('두 번째 행 데이터:', jsonData[1]);
    console.log('세 번째 행 데이터:', jsonData[2]);
    
    console.log('Q열(잔고) 데이터 샘플 (첫 3개 행):');
    for (let i = 0; i < Math.min(3, jsonData.length); i++) {
      const row = jsonData[i] as any[];
      console.log(`행 ${i+1} 잔고 데이터:`, row[balanceIndex]);
    }

    // 엑셀에서 잔고 열 위치가 확실하지 않으므로 첫 번째 데이터 행에서 숫자 형태의 데이터가 있는 열 확인
    if (jsonData.length > 1) {
      const firstDataRow = jsonData[1] as any[];
      console.log('첫 번째 데이터 행 모든 항목:');
      
      // 가장 큰 숫자를 가진 열을 찾기 위한 변수들
      let maxNumericValue = 0;
      let maxNumericIndex = -1;
      
      for (let idx = 0; idx < firstDataRow.length; idx++) {
        const value = firstDataRow[idx];
        let stringValue = String(value || '');
        // 쉼표와 공백 제거
        const cleanValue = stringValue.replace(/[,\s]/g, '');
        const numValue = parseFloat(cleanValue);
        
        console.log(`인덱스 ${idx} 값:`, value, '문자열:', stringValue, '정리:', cleanValue, '숫자변환:', isNaN(numValue) ? '불가' : numValue);
        
        // 큰 숫자 값이 있는 위치 찾기 (100만 이상이고, 계좌번호가 아닌 열)
        // 계좌번호는 일반적으로 10자리 이상의 숫자로, 잔고는 8자리 이하의 숫자로 구분
        if (!isNaN(numValue) && numValue > 1000000 && 
            // 계좌번호가 아닌지 확인 (계좌번호는 보통 10-15자리 숫자)
            !(stringValue.length >= 10 && /^\d+$/.test(cleanValue))) {
          console.log(`인덱스 ${idx}에 큰 숫자 값(${numValue})이 있고 계좌번호가 아닙니다. 잔고 열일 가능성이 높습니다.`);
          
          // 가장 큰 숫자 값 업데이트
          if (numValue > maxNumericValue) {
            maxNumericValue = numValue;
            maxNumericIndex = idx;
          }
        }
      }
      
      // 가장 큰 숫자 값을 가진 열을 찾았다면 그 열을 잔고 열로 설정
      if (maxNumericIndex >= 0) {
        console.log(`가장 큰 숫자 값(${maxNumericValue})이 있는 인덱스 ${maxNumericIndex}를 잔고 열로 자동 설정합니다.`);
        balanceIndex = maxNumericIndex;
      } else {
        // 자동 감지 실패 시 기본값 사용
        console.log('자동으로 잔고 열을 감지하지 못했습니다. 기본값(Q열, 인덱스 16)을 사용합니다.');
        balanceIndex = 16; // Q열의 인덱스
      }
    }
    
    if (contractDateIndex === -1) {
      // A열 (인덱스로는 0)
      contractDateIndex = 0;
      console.log('계약일 열을 찾을 수 없어 A열(인덱스 0)을 사용합니다.');
    }
    
    console.log('열 인덱스 매핑 결과:', {
      이메일: emailIndex,
      고객명: nameIndex,
      계약번호: contractNumberIndex,
      계좌번호: accountNumberIndex,
      잔고: balanceIndex,
      포트폴리오: portfolioIndex,
      연락처: phoneIndex,
      계약일: contractDateIndex
    });
    
    // 계약번호 또는 계좌번호 중 하나는 있어야 함
    if (emailIndex === -1 || nameIndex === -1 || (contractNumberIndex === -1 && accountNumberIndex === -1) || balanceIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 열(이메일, 이름, 계약번호/계좌번호, 잔액)을 찾을 수 없습니다.',
        },
        { status: 400 }
      );
    }
    
    // 데이터 처리
    const processedData = [];
    const yearMonth = `${year}-${month.padStart(2, '0')}`;
    
    console.log('====== 모든 행의 잔고 데이터 요약 ======');
    let validBalanceCount = 0;
    let zeroBalanceCount = 0;
    let negativeBalanceCount = 0;
    let allBalances = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      
      if (!row[emailIndex] || !row[nameIndex] || (!row[contractNumberIndex] && !row[accountNumberIndex])) {
        console.log(`행 ${i+1} 건너뜀: 필수 데이터 누락`);
        continue;
      }
      
      // 이메일 및 전화번호 정규화
      let email = emailIndex !== -1 && row[emailIndex] ? String(row[emailIndex]).trim().toLowerCase() : null;
      const name = nameIndex !== -1 && row[nameIndex] ? String(row[nameIndex]).trim() : null;
      const contractNumber = contractNumberIndex !== -1 && row[contractNumberIndex] ? String(row[contractNumberIndex]).trim() : null;
      const accountNumber = accountNumberIndex !== -1 && row[accountNumberIndex] ? String(row[accountNumberIndex]).trim() : (contractNumber || '');
      
      // 전화번호 정규화: 숫자만 남기고 모두 제거
      let phone = phoneIndex !== -1 && row[phoneIndex] ? String(row[phoneIndex]).trim() : null;
      if (phone) {
        // 하이픈, 공백, 괄호 등 제거하고 숫자만 남김
        phone = phone.replace(/[^0-9]/g, '');
        // 만약 앞에 0이 없고 총 10자리면 010을 붙임 (한국 휴대폰 번호)
        if (phone.length === 9 && !phone.startsWith('0')) {
          phone = '010' + phone.substring(1);
        }
        // 국가 코드가 있다면 제거 (+82 -> 0)
        if (phone.startsWith('82') && phone.length >= 10) {
          phone = '0' + phone.substring(2);
        }
      }
      
      // 잔고 데이터 파싱 개선
      let balance = 0;
      if (balanceIndex !== -1 && row[balanceIndex] !== undefined && row[balanceIndex] !== null) {
        let rawBalance = row[balanceIndex];
        // 원본 데이터 로깅
        console.log(`행 ${i+1} 잔고 원본 데이터:`, rawBalance, '타입:', typeof rawBalance);
        
        // 객체나 함수가 아닌 기본 데이터 타입으로 변환
        if (typeof rawBalance === 'object') {
          rawBalance = String(rawBalance);
        }
        
        // 문자열로 변환 후 쉼표, 통화 기호, 공백, 문자 등 모두 제거하고 숫자만 추출
        let cleanBalance = String(rawBalance).replace(/[^\d.-]/g, '');
        console.log(`행 ${i+1} 잔고 정리 데이터:`, cleanBalance);
        
        // 계좌번호와 비슷한 길이(10-15자리)의 숫자는 잔고가 아닐 가능성이 높음
        // 하지만 한국의 고액 자산가는 10억 이상(10자리)도 가능하므로 신중하게 판단
        if (cleanBalance.length >= 10 && /^\d+$/.test(cleanBalance)) {
          // 10자리 이상의 순수 숫자면 계좌번호일 가능성이 있음
          console.warn(`행 ${i+1} 잔고 의심 데이터: ${cleanBalance}은(는) 계좌번호일 가능성이 있어 검증 필요`);
          
          // 안전하게 처리하기 위해 계좌번호와 동일한지 확인
          if (cleanBalance === String(accountNumber).replace(/[^\d]/g, '')) {
            console.error(`행 ${i+1} 잔고 오류: 계좌번호와 동일한 값이 잔고로 지정되었습니다. 0으로 설정합니다.`);
            balance = 0;
          } else {
            // 계좌번호가 아니라면 정상적인 큰 금액일 수 있음
            balance = parseFloat(cleanBalance) || 0;
          }
        } else {
          balance = parseFloat(cleanBalance) || 0;
        }
        
        console.log(`행 ${i+1} 최종 잔고 값:`, balance);
      } else {
        console.log(`행 ${i+1} 잔고 데이터 누락 또는 잘못된 인덱스:`, balanceIndex);
      }
      
      // 잔고 통계 계산
      allBalances.push(balance);
      if (balance > 0) {
        validBalanceCount++;
      } else if (balance === 0) {
        zeroBalanceCount++;
      } else {
        negativeBalanceCount++;
      }
      
      const portfolioType = portfolioIndex !== -1 && row[portfolioIndex] ? String(row[portfolioIndex]).trim() : 'Unknown';
      let contractDate = null;
      
      // 계약일 처리 개선
      if (contractDateIndex !== -1 && row[contractDateIndex] !== undefined && row[contractDateIndex] !== null) {
        let rawDate = row[contractDateIndex];
        console.log(`행 ${i+1} 계약일 원본 데이터:`, rawDate, '타입:', typeof rawDate);
        
        try {
          // Excel 날짜는 숫자형으로 저장되는 경우가 있음 (1900년 1월 1일부터의 일수)
          // 다양한 형식 처리 시도
          if (typeof rawDate === 'number') {
            // Excel 날짜 숫자를 JavaScript Date로 변환 (Excel 기준: 1900년 1월 1일 = 1)
            const excelEpoch = new Date(1900, 0, 1); // 1900년 1월 1일
            const daysSince1900 = rawDate - 1; // Excel은 1부터 시작
            contractDate = new Date(excelEpoch);
            contractDate.setDate(excelEpoch.getDate() + daysSince1900);
          } else if (typeof rawDate === 'string') {
            // 문자열 형식 처리
            if (rawDate.includes('-') || rawDate.includes('/')) {
              // YYYY-MM-DD 또는 YYYY/MM/DD 형식
              contractDate = new Date(rawDate);
            } else if (rawDate.length === 8) {
              // YYYYMMDD 형식
              const year = rawDate.substring(0, 4);
              const month = rawDate.substring(4, 6);
              const day = rawDate.substring(6, 8);
              contractDate = new Date(`${year}-${month}-${day}`);
            } else if (rawDate.length === 6) {
              // YYMMDD 형식
              const year = parseInt(rawDate.substring(0, 2)) + 2000; // 20XX 년도
              const month = rawDate.substring(2, 4);
              const day = rawDate.substring(4, 6);
              contractDate = new Date(`${year}-${month}-${day}`);
            }
          } else if (rawDate instanceof Date) {
            contractDate = rawDate;
          }
          
          // 유효한 날짜인지 검증
          if (contractDate && !isNaN(contractDate.getTime())) {
            console.log(`행 ${i+1} 최종 계약일:`, contractDate);
          } else {
            console.log(`행 ${i+1} 계약일 변환 실패, 현재 날짜로 대체`);
            contractDate = new Date(); // 실패하면 현재 날짜로
          }
        } catch (dateError) {
          console.error(`행 ${i+1} 계약일 처리 중 오류:`, dateError);
          contractDate = new Date(); // 오류 발생하면 현재 날짜로
        }
      }
      
      // 필수 데이터 확인 (계좌번호는 반드시 있어야 함)
      if (!email || !accountNumber) {
        console.log(`행 ${i+1} 건너뜀: 필수 데이터(이메일/계좌번호) 형식 오류`);
        continue;
      }
      
      // 잔고 유효성 검사 - 0 이하의 값도 허용하지만 경고 표시
      if (balance <= 0) {
        console.warn(`행 ${i+1} 잔고 데이터 의심됨:`, balance, '(0 이하 값이거나 파싱 오류일 수 있음)');
      }
      
      processedData.push({
        email,
        name,
        account_number: accountNumber,
        portfolio_type: portfolioType,
        phone,
        balance,
        contract_date: contractDate ? contractDate.toISOString() : null,
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
    console.log('잔고 데이터 통계:', {
      총_데이터수: jsonData.length - 1,
      처리된_데이터수: processedData.length,
      양수_잔고수: validBalanceCount,
      영_잔고수: zeroBalanceCount,
      음수_잔고수: negativeBalanceCount,
      최소값: Math.min(...allBalances),
      최대값: Math.max(...allBalances),
      평균값: allBalances.reduce((sum, val) => sum + val, 0) / allBalances.length
    });
    
    // 처리 결과 생성 - 각 항목별 처리 횟수 카운트
    const resultStats = {
      total_processed: processedData.length,
      users_updated: 0,
      accounts_updated: 0,
      balance_records_updated: 0,
      portfolio_types_updated: 0,
      errors: 0
    };

    // 계좌 및 잔고 저장 관련 상세 통계
    const detailedStats = {
      accounts: {
        created: 0,
        updated: 0,
        errors: 0
      },
      balances: {
        created: 0, 
        updated: 0,
        errors: 0,
        zero_values: 0
      }
    };
    
    try {
      // 사용자 및 계좌 정보 업데이트
      for (const item of processedData) {
        // 1. 사용자 정보 저장/업데이트
        console.log('사용자 정보 저장 시작:', { email: item.email, name: item.name, phone: item.phone });
        
        let userId = null;
        
        // 1-1. 전화번호와 이름으로 기존 사용자 검색 (고객 일원화)
        if (item.phone && item.name) {
          console.log('전화번호와 이름으로 사용자 검색:', { phone: item.phone, name: item.name });
          
          // 전화번호로 유사한 사용자 검색
          const { data: existingUsersByPhone, error: phoneSearchError } = await supabaseAdmin
            .from('users')
            .select('id, email, name, phone')
            .eq('phone', item.phone);
            
          if (phoneSearchError) {
            console.error('전화번호 기반 사용자 검색 오류:', phoneSearchError);
          } else if (existingUsersByPhone && existingUsersByPhone.length > 0) {
            console.log('전화번호로 사용자 후보 발견:', existingUsersByPhone.length);
            
            // 이름이 정확히 일치하거나 유사한 사용자 찾기
            const matchedUser = existingUsersByPhone.find(user => 
              user.name?.toLowerCase() === item.name?.toLowerCase()
            );
            
            if (matchedUser) {
              // 전화번호와 이름이 일치하는 사용자 발견
              userId = matchedUser.id;
              console.log('전화번호/이름 기반 기존 사용자 발견:', { 
                userId, 
                existingEmail: matchedUser.email,
                newEmail: item.email
              });
              
              // 이메일이 다른 경우 (새 이메일이 추가된 경우) 메타데이터에 모든 이메일 저장
              if (matchedUser.email.toLowerCase() !== item.email.toLowerCase()) {
                console.log('기존 사용자에 새 이메일 추가:', { 
                  userId, 
                  existingEmail: matchedUser.email, 
                  newEmail: item.email 
                });
                
                // 기존 사용자의 메타데이터 조회
                const { data: userData, error: userDataError } = await supabaseAdmin
                  .from('users')
                  .select('metadata')
                  .eq('id', userId)
                  .single();
                  
                if (!userDataError && userData) {
                  // 메타데이터 업데이트 (추가 이메일 저장)
                  const metadata = userData.metadata || {};
                  const additionalEmails = metadata.additional_emails || [];
                  
                  // 이미 저장된 이메일이 아닌 경우에만 추가 (대소문자 무시)
                  const emailExists = additionalEmails.some((e: string) => 
                    e.toLowerCase() === item.email.toLowerCase()
                  );
                  
                  if (!emailExists) {
                    additionalEmails.push(item.email);
                    metadata.additional_emails = additionalEmails;
                    
                    // 메타데이터 업데이트
                    const { error: updateError } = await supabaseAdmin
                      .from('users')
                      .update({ metadata })
                      .eq('id', userId);
                      
                    if (updateError) {
                      console.error('사용자 메타데이터 업데이트 오류:', updateError);
                    } else {
                      console.log('사용자 메타데이터 업데이트 성공 (추가 이메일):', additionalEmails);
                    }
                  }
                }
              }
            }
          }
        }
        
        // 1-2. 사용자 ID가 아직 확인되지 않은 경우 이메일로 검색 (대소문자 무시)
        if (!userId && item.email) {
          console.log('이메일로 사용자 검색:', item.email);
          
          // 대소문자를 무시하고 이메일로 검색
          const { data: existingUsersByEmail, error: emailSearchError } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .ilike('email', item.email); // ilike는 대소문자를 구분하지 않음
            
          if (emailSearchError) {
            console.error('이메일 기반 사용자 검색 오류:', emailSearchError);
          } else if (existingUsersByEmail && existingUsersByEmail.length > 0) {
            // 정확히 일치하는 이메일 먼저 찾기
            const exactMatch = existingUsersByEmail.find(user => 
              user.email.toLowerCase() === item.email.toLowerCase()
            );
            
            if (exactMatch) {
              userId = exactMatch.id;
              console.log('이메일 기반 기존 사용자 발견 (정확히 일치):', { userId, email: item.email });
            } else {
              // 정확히 일치하는 것이 없으면 첫 번째 항목 사용
              userId = existingUsersByEmail[0].id;
              console.log('이메일 기반 기존 사용자 발견 (유사 일치):', { userId, email: existingUsersByEmail[0].email });
            }
          }
        }
        
        // 1-3. 사용자가 없는 경우 새로 생성
        if (!userId) {
          console.log('새 사용자 생성:', { email: item.email, name: item.name, phone: item.phone });
          
          const { data: newUser, error: createUserError } = await supabaseAdmin
            .from('users')
            .insert({
              email: item.email,
              name: item.name,
              phone: item.phone,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();
            
          if (createUserError) {
            console.error('사용자 생성 오류:', createUserError);
            resultStats.errors++;
            continue;
          } else if (newUser) {
            userId = newUser.id;
            console.log('새 사용자 생성 성공:', { userId, email: item.email });
            resultStats.users_updated++;
          } else {
            console.error('사용자 생성 후 ID를 찾을 수 없음');
            continue;
          }
        } else {
          // 1-4. 기존 사용자 정보 업데이트
          console.log('기존 사용자 정보 업데이트:', { userId, name: item.name, phone: item.phone });
          
          const { error: updateUserError } = await supabaseAdmin
            .from('users')
            .update({
              name: item.name,
              phone: item.phone,
              email: item.email.toLowerCase(), // 이메일을 소문자로 통일
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (updateUserError) {
            console.error('사용자 정보 업데이트 오류:', updateUserError);
          } else {
            console.log('사용자 정보 업데이트 성공:', { userId, name: item.name });
            resultStats.users_updated++;
          }
        }
        
        // 사용자 ID 확인 실패시 처리 중단
        if (!userId) {
          console.error('사용자 ID를 확인할 수 없어 계속 진행할 수 없습니다:', { email: item.email, name: item.name });
          continue;
        }
        
        // 포트폴리오 타입 저장/업데이트
        const portfolioType = item.portfolio_type.trim();
        let portfolioTypeId = null;
        
        try {
          console.log('포트폴리오 타입 조회/생성 시도:', portfolioType);
          
          // 이미 존재하는 포트폴리오 타입인지 확인
          const { data: existingPortfolio, error: portfolioFetchError } = await supabaseAdmin
            .from('portfolio_types')
            .select('id')
            .eq('name', portfolioType)
            .single();
          
          if (portfolioFetchError && portfolioFetchError.code !== 'PGRST116') {
            // PGRST116은 "결과 없음" 오류이므로 이 경우가 아닌 진짜 오류만 기록
            console.error('포트폴리오 타입 조회 오류:', portfolioFetchError);
            console.error('오류 상세 정보:', JSON.stringify(portfolioFetchError));
          }
            
          if (existingPortfolio) {
            // 이미 존재하는 포트폴리오 타입
            portfolioTypeId = existingPortfolio.id;
            console.log('기존 포트폴리오 타입 사용:', { id: portfolioTypeId, name: portfolioType });
          } else {
            // 새 포트폴리오 타입 생성
            console.log('새 포트폴리오 타입 생성:', portfolioType);
            
            const { data: newPortfolioType, error: createError } = await supabaseAdmin
              .from('portfolio_types')
              .insert({ name: portfolioType })
              .select('id')
              .single();
              
            if (createError) {
              console.error('포트폴리오 타입 생성 오류:', createError);
              console.error('오류 상세 정보:', JSON.stringify(createError));
            } else if (newPortfolioType) {
              portfolioTypeId = newPortfolioType.id;
              resultStats.portfolio_types_updated++;
              console.log('새 포트폴리오 타입 생성 성공:', { id: portfolioTypeId, name: portfolioType });
            }
          }
        } catch (portfolioError) {
          console.error('포트폴리오 타입 처리 중 예외 발생:', portfolioError);
          console.error('스택 트레이스:', portfolioError instanceof Error ? portfolioError.stack : 'No stack trace');
        }
        
        // 2. 계좌 정보 저장/업데이트
        console.log('계좌 및 관련 정보:', {
          user_id: userId,
          account_number: item.account_number,
          contract_date: item.contract_date,
          portfolio_type: item.portfolio_type || '미지정'
        });
        
        // 계약일자 파싱 개선
        let contractDate: string | null = null;
        
        if (item.contract_date) {
          console.log('계약일자 원본 데이터:', {
            value: item.contract_date,
            type: typeof item.contract_date
          });
          
          try {
            // Excel 날짜 숫자 처리 (1900년 1월 1일부터의 일수)
            if (typeof item.contract_date === 'number') {
              // Excel의 시리얼 날짜를 JavaScript Date로 변환
              // Excel은 1900년 1월 1일이 1, JavaScript는 1970년 1월 1일이 0
              const excelEpoch = new Date(1899, 11, 30); // 1899-12-30, Excel 기준점
              const msPerDay = 24 * 60 * 60 * 1000;
              const excelDate = new Date(excelEpoch.getTime() + (item.contract_date * msPerDay));
              contractDate = excelDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
              console.log('Excel 숫자 날짜 변환:', { original: item.contract_date, converted: contractDate });
            }
            // 문자열 형식 날짜 처리
            else if (typeof item.contract_date === 'string') {
              // "YYYY-MM-DD" 또는 "YYYY/MM/DD" 또는 "DD-MM-YYYY" 등 다양한 형식 처리
              // 날짜 문자열에서 숫자만 추출
              const dateNumbers = item.contract_date.match(/\d+/g);
              
              if (dateNumbers && dateNumbers.length >= 3) {
                // 년-월-일 형식 추정 (가장 일반적인 경우)
                // 4자리 숫자가 있으면 연도로 간주
                let year, month, day;
                
                if (dateNumbers[0].length === 4) {
                  // "YYYY-MM-DD" 형식
                  year = dateNumbers[0];
                  month = dateNumbers[1].padStart(2, '0');
                  day = dateNumbers[2].padStart(2, '0');
                } else if (dateNumbers[2].length === 4) {
                  // "DD-MM-YYYY" 형식
                  day = dateNumbers[0].padStart(2, '0');
                  month = dateNumbers[1].padStart(2, '0');
                  year = dateNumbers[2];
                } else {
                  // 기타 형식: 첫번째 숫자를 일, 두번째를 월, 세번째를 연도로 가정
                  day = dateNumbers[0].padStart(2, '0');
                  month = dateNumbers[1].padStart(2, '0');
                  year = dateNumbers[2].length === 2 ? `20${dateNumbers[2]}` : dateNumbers[2];
                }
                
                contractDate = `${year}-${month}-${day}`;
                console.log('문자열 날짜 변환:', { original: item.contract_date, converted: contractDate });
              } else {
                // 날짜 형식을 파싱할 수 없는 경우
                console.warn('날짜 형식을 파싱할 수 없음:', item.contract_date);
                contractDate = null;
              }
            } else {
              console.warn('지원되지 않는 계약일자 형식:', typeof item.contract_date);
              contractDate = null;
            }
          } catch (dateError) {
            console.error('계약일자 변환 오류:', dateError);
            contractDate = null;
          }
        }
        
        let accountId = '';
        let accountUpdateSuccess = false;
        let balanceWriteAttempted = false;
        
        try {
          // 먼저 해당 계좌번호의 계좌가 있는지 확인
          let existingAccount;
          let existingAccountError;
          
          try {
            const result = await supabaseAdmin
              .from('accounts')
              .select('id, user_id, portfolio_type_id')
              .eq('account_number', item.account_number)
              .maybeSingle();
              
            existingAccount = result.data;
            existingAccountError = result.error;
          } catch (queryError) {
            console.error('계좌 조회 중 예외 발생:', queryError);
            existingAccountError = { message: '계좌 조회 중 예외 발생' };
          }
            
          console.log('기존 계좌 조회 결과:', {
            found: !!existingAccount,
            data: existingAccount,
            error: existingAccountError
          });
          
          if (existingAccount) {
            // 계좌가 이미 존재하면 업데이트
            console.log('기존 계좌 발견, 업데이트 시도:', existingAccount);
            
            const updateData: any = {
              user_id: userId,
              updated_at: new Date().toISOString()
            };
            
            // null이 아닌 필드만 업데이트 데이터에 추가
            if (portfolioTypeId) updateData.portfolio_type_id = portfolioTypeId;
            if (contractDate) updateData.contract_date = contractDate;
            
            console.log('계좌 업데이트 데이터:', updateData);
            
            const { data: updatedAccount, error: updateAccountError } = await supabaseAdmin
              .from('accounts')
              .update(updateData)
              .eq('id', existingAccount.id)
              .select('id, user_id, portfolio_type_id');
              
            console.log('계좌 업데이트 결과:', {
              success: !updateAccountError,
              data: updatedAccount,
              error: updateAccountError
            });
              
            if (updateAccountError) {
              console.error('계좌 정보 업데이트 오류:', updateAccountError);
              // 오류가 있지만 ID는 있으므로 잔고 업데이트는 계속 진행
              detailedStats.accounts.errors++;
            } else {
              accountUpdateSuccess = true;
              detailedStats.accounts.updated++;
            }
            
            accountId = existingAccount.id;
            console.log('기존 계좌 ID 사용:', { accountId, accountNumber: item.account_number });
          } else {
            // 계좌가 없으면 신규 생성
            console.log('계좌 정보 없음, 신규 생성 시도');
            
            // 계좌 생성 데이터 준비
            const accountData: any = {
              user_id: userId,
              account_number: item.account_number,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // null이 아닌 선택적 필드 추가
            if (portfolioTypeId) accountData.portfolio_type_id = portfolioTypeId;
            if (contractDate) accountData.contract_date = contractDate;
            
            console.log('신규 계좌 생성 데이터:', accountData);
            
            const { data: newAccount, error: newAccountError } = await supabaseAdmin
              .from('accounts')
              .insert(accountData)
              .select('id, user_id, portfolio_type_id');
              
            console.log('계좌 생성 결과:', {
              success: !newAccountError,
              data: newAccount,
              error: newAccountError
            });
              
            if (newAccountError) {
              console.error('계좌 정보 생성 오류:', newAccountError);
              detailedStats.accounts.errors++;
              
              // 오류 정보를 자세히 기록
              if (newAccountError.details) {
                console.error('오류 세부 정보:', newAccountError.details);
              }
              if (newAccountError.hint) {
                console.error('오류 힌트:', newAccountError.hint);
              }
              
              // 생성 실패 시 이미 존재하는 경우 가능성 (레이스 컨디션)
              try {
                console.log('계좌 생성 실패 후 다시 조회 시도');
                const { data: retryAccount } = await supabaseAdmin
                  .from('accounts')
                  .select('id')
                  .eq('account_number', item.account_number)
                  .single();
                  
                if (retryAccount) {
                  console.log('재시도 조회로 계좌 ID 발견:', retryAccount);
                  accountId = retryAccount.id;
                  accountUpdateSuccess = true;
                  detailedStats.accounts.updated++;
                }
              } catch (retryError) {
                console.error('계좌 재조회 실패:', retryError);
              }
            } else if (!newAccount || newAccount.length === 0) {
              console.error('계좌 생성 후 ID를 가져올 수 없습니다:', item.account_number);
            } else {
              accountId = newAccount[0].id;
              accountUpdateSuccess = true;
              detailedStats.accounts.created++;
              console.log('새 계좌 생성 성공:', { accountId, accountNumber: item.account_number });
            }
          }
        } catch (accountError) {
          console.error('계좌 처리 중 예외 발생:', accountError);
        }
        
        if (!accountId) {
          console.error('계좌 ID를 얻지 못했습니다. 잔고 업데이트를 건너뜁니다.');
          continue;
        }
        
        // 계좌 업데이트 성공 카운터 증가
        if (accountUpdateSuccess) {
          resultStats.accounts_updated++;
        }
        
        // 3. 잔고 정보 저장
        try {
          console.log('***** 잔고 레코드 처리 시작 *****');
          console.log(`계좌ID: ${accountId}, 연월: ${yearMonth}, 잔고: ${item.balance}, 계좌번호: ${item.account_number}`);
          
          const currentDate = new Date();
          const recordDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0); // 이번 달의 마지막 날
                    
          // balance_records 테이블 구조 확인
          const { data: tableInfo, error: tableError } = await supabaseAdmin
            .from('balance_records')
            .select('*')
            .limit(1);
            
          if (tableError) {
            console.error('balance_records 테이블 조회 오류:', tableError);
            console.error('테이블 구조 확인 필요');
          } else {
            console.log('balance_records 테이블 샘플 데이터:', tableInfo);
            console.log('테이블 컬럼:', Object.keys(tableInfo[0] || {}));
          }
          
          // balance_records 테이블에 account_number 컬럼 확인
          const hasAccountNumber = tableInfo && tableInfo[0] && 'account_number' in tableInfo[0];
          console.log('account_number 컬럼 존재 여부:', hasAccountNumber ? '있음' : '없음');
          
          // 잔고 기록 생성할 데이터 준비
          const balanceRecord: any = {
            account_id: accountId,
            balance: item.balance,
            year_month: yearMonth,
            record_date: recordDate.toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // account_number 컬럼이 있을 경우만 추가
          if (hasAccountNumber) {
            balanceRecord.account_number = item.account_number || '';
          } else {
            console.warn('account_number 컬럼이 없습니다. 해당 필드 저장을 건너뜁니다.');
          }
          
          console.log('저장할 잔고 레코드:', balanceRecord);
          
          // balance_records 테이블에 잔고 정보 저장 (upsert)
          const { data: upsertedRecord, error: upsertError } = await supabaseAdmin
            .from('balance_records')
            .upsert(balanceRecord, {
              onConflict: 'account_id,year_month',
              ignoreDuplicates: false
            })
            .select('id, account_id, year_month, balance');
          
          if (upsertError) {
            console.error('잔고 레코드 upsert 실패:', upsertError);
            console.error('오류 상세 정보:', JSON.stringify(upsertError));
            console.error('balance_records 테이블에 account_number 컬럼이 없을 수 있습니다.');
            
            // 컬럼 삭제 후 다시 시도
            if (hasAccountNumber === false) {
              console.log('account_number 컬럼 없이 다시 시도...');
              
              delete balanceRecord.account_number;
              
              const { data: retryResult, error: retryError } = await supabaseAdmin
                .from('balance_records')
                .upsert(balanceRecord, {
                  onConflict: 'account_id,year_month',
                  ignoreDuplicates: false
                })
                .select('id, account_id, year_month, balance');
                
              if (retryError) {
                console.error('두 번째 시도도 실패:', retryError);
                detailedStats.balances.errors++;
              } else {
                console.log('두 번째 시도 성공:', retryResult);
                resultStats.balance_records_updated++;
                detailedStats.balances.created++;
              }
            }
            
            // 중복 제약조건 오류인 경우 업데이트 시도
            else if (upsertError.code === '23505') { // 중복 키 위반 오류 코드
              console.log('이미 존재하는 레코드를 업데이트 시도...');
              
              const { data: existingRecord, error: selectError } = await supabaseAdmin
                .from('balance_records')
                .select('id')
                .eq('account_id', accountId)
                .eq('year_month', yearMonth)
                .single();
                
              if (selectError) {
                console.error('기존 레코드 조회 실패:', selectError);
                detailedStats.balances.errors++;
              } else if (existingRecord) {
                const { error: updateError } = await supabaseAdmin
                  .from('balance_records')
                  .update(balanceRecord)
                  .eq('id', existingRecord.id);
                  
                if (updateError) {
                  console.error('기존 레코드 업데이트 실패:', updateError);
                  detailedStats.balances.errors++;
                } else {
                  console.log('기존 레코드 업데이트 성공');
                  resultStats.balance_records_updated++;
                  detailedStats.balances.created++;
                }
              }
            } else {
              detailedStats.balances.errors++;
            }
          } else {
            console.log('잔고 레코드 upsert 성공:', upsertedRecord);
            resultStats.balance_records_updated++;
            detailedStats.balances.created++;
          }
        } catch (balanceError) {
          console.error('잔고 처리 중 예외 발생:', balanceError);
          console.error('스택 트레이스:', balanceError instanceof Error ? balanceError.stack : 'No stack trace');
        }
        
        console.log('***** 잔고 기록 저장 완료 *****');
        
        // 성공 카운터 증가
        resultStats.accounts_updated++;
        resultStats.portfolio_types_updated++;
      }
      
      // 데이터 요약 정보로 성공 응답 반환
      // 처리된 데이터의 요약 정보 추출 (최대 10개)
      const resultSummary = processedData.slice(0, 10).map(item => ({
        user: {
          name: item.name,
          email: item.email,
          phone: item.phone || '정보 없음'
        },
        account: {
          account_number: item.account_number,
          portfolio_type: item.portfolio_type
        },
        balance: {
          balance: item.balance,
          year_month: item.year_month
        }
      }));
      
      // 상세 통계 추가
      console.log('처리 완료 상세 통계:', {
        총_처리_레코드: processedData.length,
        사용자_업데이트: resultStats.users_updated,
        계좌: {
          생성: detailedStats.accounts.created,
          업데이트: detailedStats.accounts.updated,
          오류: detailedStats.accounts.errors,
          총처리: resultStats.accounts_updated
        },
        잔고: {
          생성_업데이트: resultStats.balance_records_updated,
          영값_데이터: detailedStats.balances.zero_values,
          오류: detailedStats.balances.errors
        },
        포트폴리오_유형: resultStats.portfolio_types_updated
      });
      
      return NextResponse.json({
        success: true,
        message: `총 ${processedData.length}개의 데이터가 처리되었습니다: 사용자 ${resultStats.users_updated}명, 계좌 ${resultStats.accounts_updated}개, 잔고 ${resultStats.balance_records_updated}개`,
        data: {
          inserted_count: processedData.length,
          stats: resultStats,
          detailed_stats: detailedStats,
          summary: resultSummary
        },
      });
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