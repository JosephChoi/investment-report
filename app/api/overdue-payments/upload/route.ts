import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ExcelOverdueData, OverduePaymentInsert } from '@/lib/overdue-types';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    console.log('연체정보 업로드 API 호출됨');
    
    // 파일 처리
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('업로드할 파일이 없습니다.');
      return NextResponse.json(
        {
          data: null,
          error: '업로드할 파일이 없습니다.',
        },
        { status: 400 }
      );
    }
    
    console.log('파일 정보:', file.name, file.size, file.type);
    
    // 파일 확장자 확인
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      console.error('지원하지 않는 파일 형식:', fileExt);
      return NextResponse.json(
        {
          data: null,
          error: '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.',
        },
        { status: 400 }
      );
    }
    
    // 엑셀 파일 파싱 (원본 데이터 유지)
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { raw: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 원본 데이터 형식 확인을 위해 raw 옵션 사용
    const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: true, header: 'A' });
    console.log('원본 데이터 샘플:', rawData.length > 0 ? rawData[0] : '데이터 없음');
    
    // 헤더 확인
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
    console.log('엑셀 헤더:', headers);
    
    // 미납 열 인덱스 찾기 (L열 = 11번 인덱스)
    const unpaidColumnIndex = 11; // 0부터 시작하는 인덱스에서 L열은 11
    console.log('미납 열 인덱스:', unpaidColumnIndex);
    
    const jsonData = XLSX.utils.sheet_to_json<ExcelOverdueData>(worksheet);
    
    console.log('파싱된 데이터 개수:', jsonData.length);
    
    if (jsonData.length === 0) {
      console.error('엑셀 파일에 데이터가 없습니다.');
      return NextResponse.json(
        {
          data: null,
          error: '엑셀 파일에 데이터가 없습니다.',
        },
        { status: 400 }
      );
    }
    
    // 배치 ID 생성
    const batchId = crypto.randomUUID();
    console.log('생성된 배치 ID:', batchId);
    
    // 날짜 형식 변환 함수
    const formatDate = (date: any): string | null => {
      if (!date) return null;
      
      try {
        // 날짜가 숫자인 경우 (엑셀 시리얼 날짜)
        if (typeof date === 'number' || !isNaN(Number(date))) {
          // 엑셀 날짜는 1900년 1월 1일부터의 일수 (1900년 시스템)
          const excelDate = Number(date);
          const millisecondsPerDay = 24 * 60 * 60 * 1000;
          // 1900년 1월 1일 (JavaScript에서는 0부터 시작하므로 월은 0)
          const baseDate = new Date(1900, 0, 1);
          // 엑셀의 1900년 2월 29일 버그 처리 (1900년은 실제로 윤년이 아님)
          const daysToAdd = excelDate > 60 ? excelDate - 1 : excelDate;
          const resultDate = new Date(baseDate.getTime() + daysToAdd * millisecondsPerDay);
          
          // YYYY-MM-DD 형식으로 반환
          return resultDate.toISOString().split('T')[0];
        }
        
        // 문자열인 경우
        if (typeof date === 'string') {
          // YYYY.MM.DD 또는 YYYY-MM-DD 형식 처리
          const parts = date.split(/[./-]/);
          if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // 월은 0부터 시작
            const day = parseInt(parts[2]);
            
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
              const parsedDate = new Date(year, month, day);
              return parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 반환
            }
          }
          
          // 다른 형식의 날짜 문자열 처리 시도
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 반환
          }
          
          // 변환할 수 없는 경우 원본 반환
          return date;
        }
        
        // 기타 경우 null 반환
        return null;
      } catch (e) {
        console.error('날짜 변환 오류:', e, '원본 값:', date);
        return null;
      }
    };
    
    // 데이터 변환
    const overduePayments: OverduePaymentInsert[] = jsonData.map((row, index) => {
      // 원본 데이터에서 미납 열(L열) 값 가져오기 (overdue_status로 사용)
      const rawRow = rawData[index + 1] as any; // 헤더 행을 건너뛰기 위해 +1
      const overdueStatus = rawRow['L'] || null; // L열의 값을 직접 가져옴
      
      console.log(`행 ${index + 1}의 미납 값:`, overdueStatus);
      
      return {
        account_name: row.계좌명,
        contract_date: formatDate(row.계약일),
        mp_name: row.대표MP명,
        account_number: row.계좌번호,
        withdrawal_account: row.수수료출금계좌,
        previous_day_balance: row.전일잔고,
        advisory_fee_total: row.자문수수료계,
        paid_amount: row.납입액,
        unpaid_amount: row.미납금액,
        manager: row.유치자,
        contact_number: row.연락처,
        overdue_status: overdueStatus, // L열의 값을 overdue_status로 사용
        batch_id: batchId,
      };
    });
    
    console.log('변환된 데이터 개수:', overduePayments.length);
    console.log('변환된 데이터 샘플:', overduePayments[0]);
    
    // 트랜잭션 시작 (서비스 역할 키 사용)
    console.log('기존 데이터 삭제 시작');
    const { error: deleteError } = await supabaseAdmin
      .from('overdue_payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제
    
    if (deleteError) {
      console.error('데이터 삭제 오류:', deleteError);
      throw deleteError;
    }
    
    console.log('새 데이터 삽입 시작');
    // 새 데이터 삽입 (서비스 역할 키 사용)
    const { error: insertError } = await supabaseAdmin
      .from('overdue_payments')
      .insert(overduePayments);
    
    if (insertError) {
      console.error('데이터 삽입 오류:', insertError);
      throw insertError;
    }
    
    // 업로드 이력 저장 부분은 건너뛰고 바로 결과 반환
    console.log('업로드 이력 저장 건너뛰기, 결과 반환');
    
    return NextResponse.json({
      data: {
        batchId,
        recordCount: overduePayments.length,
        fileName: file.name,
      },
      error: null,
    });
  } catch (error) {
    console.error('연체정보 업로드 오류:', error);
    
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : '연체정보 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
} 