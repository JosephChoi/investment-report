import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { createClient } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('세션 정보:', session ? '세션 있음' : '세션 없음', sessionError ? `오류: ${sessionError.message}` : '오류 없음');
    
    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: '인증되지 않은 사용자입니다. 다시 로그인해주세요.',
        },
        { status: 401 }
      );
    }
    
    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabaseAdmin
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
          success: false,
          error: '관리자만 고객 데이터를 업로드할 수 있습니다.',
        },
        { status: 403 }
      );
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
    
    // 필수 열 확인 (이메일, 이름, 계좌번호, 잔액)
    const headers = jsonData[0] as string[];
    const emailIndex = headers.findIndex(h => typeof h === 'string' && h.includes('이메일'));
    const nameIndex = headers.findIndex(h => typeof h === 'string' && (h.includes('이름') || h.includes('성명')));
    const accountIndex = headers.findIndex(h => typeof h === 'string' && h.includes('계좌'));
    const balanceIndex = headers.findIndex(h => typeof h === 'string' && (h.includes('잔액') || h.includes('금액')));
    
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
      
      processedData.push({
        email,
        name,
        account_number: accountNumber,
        balance,
        year_month: yearMonth,
        created_by: session.user.id,
        updated_by: session.user.id,
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
    
    // 기존 데이터 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('customer_data')
      .delete()
      .eq('year_month', yearMonth);
    
    if (deleteError) {
      console.error('기존 데이터 삭제 오류:', deleteError);
      throw deleteError;
    }
    
    // 새 데이터 삽입
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('customer_data')
      .insert(processedData)
      .select();
    
    if (insertError) {
      console.error('데이터 삽입 오류:', insertError);
      throw insertError;
    }
    
    // 업로드 기록 저장
    const { data: uploadRecord, error: uploadRecordError } = await supabaseAdmin
      .from('customer_data_uploads')
      .insert({
        year_month: yearMonth,
        file_name: file.name,
        record_count: processedData.length,
        uploaded_by: session.user.id,
      })
      .select()
      .single();
    
    if (uploadRecordError) {
      console.error('업로드 기록 저장 오류:', uploadRecordError);
      throw uploadRecordError;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        inserted_count: insertData?.length || 0,
        upload_record: uploadRecord,
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