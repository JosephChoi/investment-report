import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const year = formData.get('year') as string;
    const month = formData.get('month') as string;
    
    console.log('API 호출 받음:', { year, month, fileName: file?.name });
    
    if (!file || !year || !month) {
      return NextResponse.json({ error: '파일, 연도, 월 정보가 필요합니다.' }, { status: 400 });
    }
    
    // 파일 데이터를 ArrayBuffer로 변환
    const buffer = await file.arrayBuffer();
    
    // XLSX 파일 파싱
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 엑셀 파일의 첫 번째 행 확인 (헤더)
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
    console.log('엑셀 파일 헤더:', headers);
    
    // A열 헤더 확인
    const aColumnHeader = headers[0] || '';
    console.log('A열 헤더:', aColumnHeader);
    
    // 데이터를 JSON으로 변환
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // 엑셀 데이터 구조 로깅
    if (jsonData.length > 0) {
      console.log('엑셀 파일 첫 번째 행 데이터:', jsonData[0]);
      console.log('엑셀 파일 컬럼명:', Object.keys(jsonData[0] as object));
    } else {
      console.log('엑셀 파일에 데이터가 없습니다.');
      return NextResponse.json({ error: '엑셀 파일에 데이터가 없습니다.' }, { status: 400 });
    }
    
    // 계약일 컬럼 확인
    let contractDateColumnName = '';
    const possibleContractDateColumns = [
      '최초계약일', '최초 계약일', '계약일', '계약일자', '가입일', '가입일자',
      'contract_date', 'Contract Date', aColumnHeader
    ];
    
    for (const colName of possibleContractDateColumns) {
      if (headers.includes(colName) || Object.keys(jsonData[0] as object).includes(colName)) {
        contractDateColumnName = colName;
        console.log('계약일 컬럼 발견:', contractDateColumnName);
        break;
      }
    }
    
    // A열이 계약일인지 확인
    if (!contractDateColumnName && aColumnHeader) {
      // A열의 첫 번째 값이 날짜 형식인지 확인
      const firstRowAValue = Object.values(jsonData[0] as object)[0];
      if (firstRowAValue && (typeof firstRowAValue === 'string' || typeof firstRowAValue === 'number')) {
        try {
          const testDate = new Date(firstRowAValue);
          if (!isNaN(testDate.getTime())) {
            contractDateColumnName = aColumnHeader;
            console.log('A열이 날짜 형식으로 판단됨:', aColumnHeader);
          }
        } catch (e) {
          console.log('A열 값이 날짜 형식이 아님');
        }
      }
    }
    
    console.log('사용할 계약일 컬럼:', contractDateColumnName || '없음');
    
    // 데이터 처리 및 Supabase에 저장
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of jsonData) {
      const data = row as any;
      
      // 필수 필드 확인 및 데이터 매핑
      // 다양한 컬럼명 형식 지원
      const email = data.이메일 || data['이메일'] || data.email || data.Email || data['E-mail'] || data['이 메일'];
      const name = data.고객명 || data['고객명'] || data.계약자명 || data['계약자명'] || data.name || data.Name || data['성명'];
      const accountNumber = data.계좌번호 || data['계좌번호'] || data.account_number || data['Account Number'] || data['계약번호'] || data['증권번호'];
      const portfolioType = data.대표MP || data['대표MP'] || data.포트폴리오유형 || data['포트폴리오 유형'] || data.portfolio_type || data['Portfolio Type'] || data['상품명'] || data['펀드명'];
      const balance = data.전일잔고 || data['전일잔고'] || data.잔고 || data['잔고'] || data.balance || data.Balance || data['금액'] || data['평가금액'] || data['평가액'];
      const phone = data.연락처 || data['연락처'] || data.전화번호 || data['전화번호'] || data.phone || data.Phone || data['휴대폰'];
      
      // 계약일 데이터 추출
      let contractDate = null;
      if (contractDateColumnName) {
        contractDate = data[contractDateColumnName];
        
        // A열 값이 계약일인 경우 (헤더가 없는 경우)
        if (!contractDate && contractDateColumnName === aColumnHeader) {
          contractDate = Object.values(data)[0];
        }
      }
      
      // 계약일 형식 변환
      let formattedContractDate = null;
      if (contractDate) {
        try {
          // 날짜 형식이 다양할 수 있으므로 여러 형식 시도
          if (typeof contractDate === 'string') {
            // 문자열 형식의 날짜 처리
            formattedContractDate = new Date(contractDate).toISOString();
          } else if (typeof contractDate === 'number') {
            // 엑셀의 날짜 형식(시리얼 번호) 처리
            const excelEpoch = new Date(1899, 11, 30);
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            formattedContractDate = new Date(excelEpoch.getTime() + contractDate * millisecondsPerDay).toISOString();
          }
          
          // 날짜 유효성 검사
          const testDate = new Date(formattedContractDate);
          if (isNaN(testDate.getTime())) {
            console.warn('유효하지 않은 날짜 형식:', contractDate);
            formattedContractDate = null;
          }
        } catch (dateError) {
          console.warn('계약일 형식 변환 오류:', dateError);
          formattedContractDate = null;
        }
      }
      
      console.log('추출된 계약일:', { 
        원본: contractDate, 
        변환됨: formattedContractDate,
        컬럼명: contractDateColumnName
      });
      
      // 필수 데이터 확인
      if (!email && !accountNumber) {
        console.warn('이메일 또는 계좌번호가 없는 데이터:', data);
        errorCount++;
        continue;
      }
      
      if (!balance) {
        console.warn('잔고 정보가 없는 데이터:', data);
        errorCount++;
        continue;
      }
      
      try {
        // 1. 사용자 정보 저장/업데이트
        console.log('사용자 정보 저장 시도:', { email: email || 'unknown', name: name || 'unknown', phone });
        
        let userId;
        
        // 이메일이 있는 경우 이메일로 사용자 찾기
        if (email) {
          const { data: userData, error: userError } = await serviceSupabase
            .from('users')
            .upsert({
              email: email,
              name: name || 'Unknown',
              phone: phone || null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'email'
            })
            .select('id');
            
          if (userError) {
            console.error('사용자 정보 저장 오류:', userError);
            errorCount++;
            continue;
          }
          
          if (!userData || userData.length === 0) {
            // 사용자 ID를 가져오지 못한 경우 직접 조회
            const { data: fetchedUser, error: fetchError } = await serviceSupabase
              .from('users')
              .select('id')
              .eq('email', email)
              .single();
              
            if (fetchError) {
              console.error('사용자 정보 조회 오류:', fetchError);
              errorCount++;
              continue;
            }
              
            if (fetchedUser) {
              userId = fetchedUser.id;
            } else {
              console.error('사용자 정보를 찾을 수 없습니다:', email);
              errorCount++;
              continue;
            }
          } else {
            userId = userData[0].id;
          }
        } else {
          // 이메일이 없는 경우 임시 사용자 생성
          const { data: tempUser, error: tempUserError } = await serviceSupabase
            .from('users')
            .insert({
              email: `temp_${accountNumber}@example.com`,
              name: name || 'Unknown',
              phone: phone || null
            })
            .select('id');
            
          if (tempUserError) {
            console.error('임시 사용자 생성 오류:', tempUserError);
            errorCount++;
            continue;
          }
          
          if (!tempUser || tempUser.length === 0) {
            console.error('임시 사용자가 생성되었지만 ID를 반환받지 못했습니다.');
            errorCount++;
            continue;
          }
          
          userId = tempUser[0].id;
        }
        
        console.log('사용자 정보 저장 성공:', { userId, email: email || 'unknown' });
        
        // 2. 계좌 정보 저장/업데이트
        console.log('계좌 정보 저장 시도:', { 
          userId, 
          accountNumber, 
          portfolioType: portfolioType || 'Unknown', 
          contractDate: formattedContractDate 
        });
        
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
        
        // 포트폴리오 타입 ID 조회
        let portfolioTypeId = null;
        if (portfolioType && hasPortfolioTypesTable) {
          try {
            const { data: portfolioTypeData, error: portfolioTypeError } = await serviceSupabase
              .from('portfolio_types')
              .select('id')
              .eq('name', portfolioType)
              .single();
              
            if (portfolioTypeError) {
              console.warn('포트폴리오 타입 ID 조회 오류:', portfolioTypeError);
              console.log('포트폴리오 타입 이름으로 새로운 항목 생성 시도:', portfolioType);
              
              // 포트폴리오 타입이 없는 경우 새로 생성
              const { data: newPortfolioType, error: createError } = await serviceSupabase
                .from('portfolio_types')
                .insert({
                  name: portfolioType,
                  description: `${portfolioType} 포트폴리오`
                })
                .select('id');
                
              if (createError) {
                console.error('포트폴리오 타입 생성 오류:', createError);
              } else if (newPortfolioType && newPortfolioType.length > 0) {
                portfolioTypeId = newPortfolioType[0].id;
                console.log('새로운 포트폴리오 타입 생성 성공:', { id: portfolioTypeId, name: portfolioType });
              }
            } else if (portfolioTypeData) {
              portfolioTypeId = portfolioTypeData.id;
              console.log('포트폴리오 타입 ID 조회 성공:', { id: portfolioTypeId, name: portfolioType });
            }
          } catch (e) {
            console.error('포트폴리오 타입 처리 중 오류:', e);
          }
        }
        
        // 계좌 정보 객체 생성
        const accountData = {
          user_id: userId,
          account_number: accountNumber,
          updated_at: new Date().toISOString()
        };
        
        // 포트폴리오 타입 정보 추가
        if (hasPortfolioTypesTable && portfolioTypeId) {
          // @ts-ignore - 동적 필드 추가
          accountData.portfolio_type_id = portfolioTypeId;
        } else if (portfolioType) {
          // 이전 방식 호환성 유지 (portfolio_type 컬럼이 아직 존재하는 경우)
          try {
            // @ts-ignore - 동적 필드 추가
            accountData.portfolio_type = portfolioType || 'Unknown';
          } catch (e) {
            console.warn('portfolio_type 컬럼이 존재하지 않습니다:', e);
          }
        }
        
        // 계약일 정보가 있으면 추가
        if (formattedContractDate) {
          // @ts-ignore - 동적 필드 추가
          accountData.contract_date = formattedContractDate;
        }
        
        // 계좌 정보 저장
        const { data: savedAccount, error: accountError } = await serviceSupabase
          .from('accounts')
          .upsert(accountData, {
            onConflict: 'account_number'
          })
          .select('id');
          
        if (accountError) {
          console.error('계좌 정보 저장 오류:', accountError);
          errorCount++;
          continue;
        }
        
        let accountId;
        
        if (!savedAccount || savedAccount.length === 0) {
          // 계좌 ID를 가져오지 못한 경우 직접 조회
          const { data: fetchedAccount, error: fetchError } = await serviceSupabase
            .from('accounts')
            .select('id')
            .eq('account_number', accountNumber)
            .single();
            
          if (fetchError) {
            console.error('계좌 정보 조회 오류:', fetchError);
            errorCount++;
            continue;
          }
            
          if (fetchedAccount) {
            accountId = fetchedAccount.id;
          } else {
            console.error('계좌 정보를 찾을 수 없습니다:', accountNumber);
            errorCount++;
            continue;
          }
        } else {
          accountId = savedAccount[0].id;
        }
        
        // 계약일 정보가 있지만 upsert에서 누락된 경우 직접 업데이트
        if (formattedContractDate) {
          const { error: updateError } = await serviceSupabase
            .from('accounts')
            .update({ contract_date: formattedContractDate })
            .eq('id', accountId);
            
          if (updateError) {
            console.error('계약일 업데이트 오류:', updateError);
          } else {
            console.log('계약일 업데이트 성공:', { accountId, contractDate: formattedContractDate });
          }
        }
        
        console.log('계좌 정보 저장 성공:', { accountId, accountNumber });
        
        // 3. 잔고 정보 저장
        const year_month = `${year}-${month}`;
        const balanceValue = typeof balance === 'string' ? parseFloat(balance.replace(/,/g, '')) : parseFloat(balance);
        
        console.log('잔고 정보 저장 시도:', { accountId, year_month, balance: balanceValue });
        
        const { data: balanceData, error: balanceError } = await serviceSupabase
          .from('balance_records')
          .upsert({
            account_id: accountId,
            year_month: year_month,
            balance: balanceValue,
            record_date: new Date().toISOString()
          }, {
            onConflict: 'account_id, year_month'
          });
          
        if (balanceError) {
          console.error('잔고 정보 저장 오류 상세:', balanceError);
          errorCount++;
          continue;
        }
        
        console.log('잔고 정보 저장 성공:', { accountId, year_month, balance: balanceValue });
        successCount++;
        
        // 결과 추가
        results.push({
          user: { id: userId, name: name || 'Unknown', email: email || 'unknown' },
          account: { 
            id: accountId, 
            account_number: accountNumber, 
            portfolio_type: portfolioType || 'Unknown',
            contract_date: formattedContractDate
          },
          balance: { balance: balanceValue }
        });
      } catch (rowError: any) {
        console.error('행 처리 중 오류:', rowError);
        errorCount++;
      }
    }
    
    // 업로드 기록 저장
    try {
      await serviceSupabase
        .from('customer_uploads')
        .insert({
          file_name: file.name,
          year: year,
          month: month,
          record_count: successCount,
          uploaded_at: new Date().toISOString()
        });
    } catch (uploadLogError) {
      console.error('업로드 기록 저장 오류:', uploadLogError);
    }
    
    return NextResponse.json({
      success: true,
      message: `${successCount}개의 고객 데이터가 성공적으로 처리되었습니다. ${errorCount}개의 데이터에서 오류가 발생했습니다.`,
      data: results
    });
    
  } catch (error: any) {
    console.error('고객 데이터 업로드 오류:', error);
    return NextResponse.json({
      error: '고객 데이터 처리 중 오류가 발생했습니다.',
      details: error.message
    }, { status: 500 });
  }
} 