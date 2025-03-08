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
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // 엑셀 데이터 구조 로깅
    if (jsonData.length > 0) {
      console.log('엑셀 파일 첫 번째 행 데이터:', jsonData[0]);
      console.log('엑셀 파일 컬럼명:', Object.keys(jsonData[0] as object));
    } else {
      console.log('엑셀 파일에 데이터가 없습니다.');
      return NextResponse.json({ error: '엑셀 파일에 데이터가 없습니다.' }, { status: 400 });
    }
    
    // Supabase 테이블 구조 확인
    try {
      const { data: usersColumns, error: usersError } = await serviceSupabase.rpc('get_table_columns', { table_name: 'users' });
      if (usersError) throw usersError;
      console.log('Users 테이블 컬럼:', usersColumns);
      
      const { data: accountsColumns, error: accountsError } = await serviceSupabase.rpc('get_table_columns', { table_name: 'accounts' });
      if (accountsError) throw accountsError;
      console.log('Accounts 테이블 컬럼:', accountsColumns);
      
      const { data: balanceColumns, error: balanceError } = await serviceSupabase.rpc('get_table_columns', { table_name: 'balance_records' });
      if (balanceError) throw balanceError;
      console.log('Balance Records 테이블 컬럼:', balanceColumns);
    } catch (error: any) {
      console.error('테이블 구조 확인 오류:', error);
    }
    
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
        console.log('계좌 정보 저장 시도:', { userId, accountNumber, portfolioType: portfolioType || 'Unknown' });
        
        const { data: accountData, error: accountError } = await serviceSupabase
          .from('accounts')
          .upsert({
            user_id: userId,
            account_number: accountNumber,
            portfolio_type: portfolioType || 'Unknown',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'account_number'
          })
          .select('id');
          
        if (accountError) {
          console.error('계좌 정보 저장 오류:', accountError);
          errorCount++;
          continue;
        }
        
        let accountId;
        
        if (!accountData || accountData.length === 0) {
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
          accountId = accountData[0].id;
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
          account: { id: accountId, account_number: accountNumber, portfolio_type: portfolioType || 'Unknown' },
          balance: { balance: balanceValue }
        });
      } catch (rowError: any) {
        console.error('행 처리 중 오류:', rowError);
        errorCount++;
      }
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