import { NextRequest, NextResponse } from 'next/server';
import { createClient, getServiceSupabase } from '@/lib/supabase';
import { ExcelOverdueData, OverduePaymentInsert } from '@/lib/overdue-types';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 세션 정보 가져오기
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('세션 정보:', session ? '세션 있음' : '세션 없음', sessionError ? `오류: ${sessionError.message}` : '오류 없음');
    
    if (sessionError || !session) {
      return NextResponse.json(
        {
          data: null,
          error: '인증되지 않은 사용자입니다. 다시 로그인해주세요.',
        },
        { status: 401 }
      );
    }
    
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // 관리자 권한 확인
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    console.log('사용자 정보:', userData, userError ? `오류: ${userError.message}` : '오류 없음');
    
    if (userError) {
      throw userError;
    }
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        {
          data: null,
          error: '관리자만 연체정보를 업로드할 수 있습니다.',
        },
        { status: 403 }
      );
    }
    
    // 파일 처리
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        {
          data: null,
          error: '업로드할 파일이 없습니다.',
        },
        { status: 400 }
      );
    }
    
    // 파일 확장자 확인
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      return NextResponse.json(
        {
          data: null,
          error: '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.',
        },
        { status: 400 }
      );
    }
    
    // 엑셀 파일 파싱
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<ExcelOverdueData>(worksheet);
    
    if (jsonData.length === 0) {
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
    
    // 데이터 변환
    const overduePayments: OverduePaymentInsert[] = jsonData.map((row) => ({
      account_name: row.계좌명,
      contract_date: row.계약일 ? new Date(row.계약일).toISOString() : null,
      mp_name: row.대표MP명,
      account_number: row.계좌번호,
      withdrawal_account: row.수수료출금계좌,
      previous_day_balance: row.전일잔고,
      advisory_fee_total: row.자문수수료계,
      paid_amount: row.납입액,
      unpaid_amount: row.미납금액,
      manager: row.유치자,
      contact_number: row.연락처,
      overdue_status: row.연체,
      batch_id: batchId,
    }));
    
    // 트랜잭션 시작 (서비스 역할 키 사용)
    const { error: deleteError } = await serviceSupabase
      .from('overdue_payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제
    
    if (deleteError) {
      throw deleteError;
    }
    
    // 새 데이터 삽입 (서비스 역할 키 사용)
    const { error: insertError } = await serviceSupabase
      .from('overdue_payments')
      .insert(overduePayments);
    
    if (insertError) {
      throw insertError;
    }
    
    // 업로드 이력 저장 (서비스 역할 키 사용)
    const { error: uploadHistoryError } = await serviceSupabase
      .from('overdue_payment_uploads')
      .insert({
        id: batchId,
        file_name: file.name,
        record_count: overduePayments.length,
        uploaded_by: session.user.id,
      });
    
    if (uploadHistoryError) {
      throw uploadHistoryError;
    }
    
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
      },
      { status: 500 }
    );
  }
} 