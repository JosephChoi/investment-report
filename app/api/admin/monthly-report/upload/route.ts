import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFile, extractDateFromFilename } from '@/lib/utils';
import { db } from '@/db';
import { users, accounts, balanceRecords } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * 고객 데이터 엑셀 파일 업로드 처리 API
 */
export async function POST(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // multipart/form-data 형식으로 전송된 파일 가져오기
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }
    
    // 파일명에서 날짜 추출
    const recordDate = extractDateFromFilename(file.name);
    if (!recordDate) {
      return NextResponse.json({ error: '파일명에서 날짜를 추출할 수 없습니다. 파일명에 YYYY-MM-DD 형식의 날짜가 포함되어야 합니다.' }, { status: 400 });
    }
    
    // 엑셀 파일 파싱
    const data = await parseExcelFile(file);
    
    console.log('파싱된 엑셀 데이터:', data);
    
    try {
      // Drizzle ORM을 사용한 트랜잭션 시작
      const results = await db.transaction(async (tx) => {
        const processedRecords = [];
        
        for (const row of data as any[]) {
          // 필수 필드 확인
          const { 이름, 이메일, 계좌번호, 포트폴리오명, 말일잔고 } = row;
          
          if (!이름 || !이메일 || !계좌번호 || !포트폴리오명 || 말일잔고 === undefined) {
            continue; // 필수 필드가 없는 행은 건너뛰기
          }
          
          // 사용자 조회 또는 생성
          let user = await tx.query.users.findFirst({
            where: eq(users.email, 이메일)
          });
          
          if (!user) {
            // 새 사용자 생성
            const [newUser] = await tx.insert(users).values({
              name: 이름,
              email: 이메일,
              phone: row.전화번호 || '',
              role: 'user'
            }).returning();
            
            user = newUser;
          }
          
          // 계좌 조회 또는 생성
          let account = await tx.query.accounts.findFirst({
            where: eq(accounts.account_number, 계좌번호)
          });
          
          if (!account) {
            // 포트폴리오 타입 ID 조회
            let portfolioTypeId = null;
            const { data: portfolioType, error: portfolioTypeError } = await serviceSupabase
              .from('portfolio_types')
              .select('id')
              .eq('name', 포트폴리오명)
              .single();
            
            if (!portfolioTypeError && portfolioType) {
              portfolioTypeId = portfolioType.id;
            } else {
              console.warn('포트폴리오 타입 ID 조회 실패:', 포트폴리오명);
            }
            
            // 새 계좌 생성 - Drizzle ORM에서는 스키마에 정의된 필드만 사용
            const [newAccount] = await tx.insert(accounts).values({
              user_id: user.id,
              account_number: 계좌번호,
              portfolio_type: 포트폴리오명,
              // portfolio_type_id 필드는 Drizzle 스키마에 정의되어 있지 않으면 사용할 수 없음
              // contract_date 필드도 스키마에 정의되어 있는지 확인 필요
            }).returning();
            
            account = newAccount;
          }
          
          // 잔고 기록 생성
          const [balanceRecord] = await tx.insert(balanceRecords).values({
            account_id: account.id,
            balance: 말일잔고,
            record_date: recordDate
          }).returning();
          
          processedRecords.push({
            user: { id: user.id, name: user.name, email: user.email },
            account: { id: account.id, account_number: account.account_number, portfolio_type: account.portfolio_type },
            balance: { id: balanceRecord.id, balance: balanceRecord.balance, record_date: balanceRecord.record_date }
          });
        }
        
        return processedRecords;
      });
      
      console.log('Drizzle ORM으로 처리된 결과:', results);
      
      return NextResponse.json({ 
        success: true, 
        message: `${results.length}개의 데이터가 성공적으로 처리되었습니다.`,
        data: results
      });
    } catch (dbError) {
      console.error('Drizzle ORM 처리 오류:', dbError);
      
      // Drizzle ORM 실패 시 Supabase 클라이언트로 직접 처리 시도
      const processedRecords = [];
      
      for (const row of data as any[]) {
        try {
          // 필수 필드 확인
          const { 이름, 이메일, 계좌번호, 포트폴리오명, 말일잔고 } = row;
          
          if (!이름 || !이메일 || !계좌번호 || !포트폴리오명 || 말일잔고 === undefined) {
            continue; // 필수 필드가 없는 행은 건너뛰기
          }
          
          // 사용자 조회 또는 생성
          let { data: user, error: userError } = await serviceSupabase
            .from('users')
            .select('*')
            .eq('email', 이메일)
            .single();
          
          if (userError || !user) {
            // 새 사용자 생성
            const { data: newUser, error: insertUserError } = await serviceSupabase
              .from('users')
              .insert({
                name: 이름,
                email: 이메일,
                phone: row.전화번호 || '',
                role: 'user'
              })
              .select()
              .single();
            
            if (insertUserError) {
              console.error('사용자 생성 오류:', insertUserError);
              continue;
            }
            
            user = newUser;
          }
          
          // 계좌 조회 또는 생성
          let { data: account, error: accountError } = await serviceSupabase
            .from('accounts')
            .select('*')
            .eq('account_number', 계좌번호)
            .single();
          
          if (accountError || !account) {
            // 포트폴리오 타입 ID 조회
            let portfolioTypeId = null;
            const { data: portfolioType, error: portfolioTypeError } = await serviceSupabase
              .from('portfolio_types')
              .select('id')
              .eq('name', 포트폴리오명)
              .single();
            
            if (!portfolioTypeError && portfolioType) {
              portfolioTypeId = portfolioType.id;
            } else {
              console.warn('포트폴리오 타입 ID 조회 실패:', 포트폴리오명);
            }
            
            // 새 계좌 생성
            const { data: newAccount, error: insertAccountError } = await serviceSupabase
              .from('accounts')
              .insert({
                user_id: user.id,
                account_number: 계좌번호,
                portfolio_type: 포트폴리오명,
                portfolio_type_id: portfolioTypeId,
                contract_date: row.계약일 ? new Date(row.계약일).toISOString() : null
              })
              .select()
              .single();
            
            if (insertAccountError) {
              console.error('계좌 생성 오류:', insertAccountError);
              continue;
            }
            
            account = newAccount;
          }
          
          // 잔고 기록 생성
          const { data: balanceRecord, error: balanceError } = await serviceSupabase
            .from('balance_records')
            .insert({
              account_id: account.id,
              balance: 말일잔고,
              record_date: recordDate.toISOString()
            })
            .select()
            .single();
          
          if (balanceError) {
            console.error('잔고 기록 생성 오류:', balanceError);
            continue;
          }
          
          processedRecords.push({
            user: { id: user.id, name: user.name, email: user.email },
            account: { id: account.id, account_number: account.account_number, portfolio_type: account.portfolio_type },
            balance: { id: balanceRecord.id, balance: balanceRecord.balance, record_date: balanceRecord.record_date }
          });
        } catch (rowError) {
          console.error('행 처리 오류:', rowError);
          // 개별 행 오류는 건너뛰고 계속 진행
        }
      }
      
      console.log('Supabase 직접 처리 결과:', processedRecords);
      
      return NextResponse.json({ 
        success: true, 
        message: `${processedRecords.length}개의 데이터가 Supabase를 통해 직접 처리되었습니다.`,
        data: processedRecords
      });
    }
    
  } catch (error) {
    console.error('고객 데이터 업로드 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '데이터 처리 중 오류가 발생했습니다.', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 