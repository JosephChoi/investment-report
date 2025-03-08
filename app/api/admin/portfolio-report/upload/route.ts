import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';
import { db } from '@/db';
import { portfolioReports } from '@/db/schema';
import { extractDateFromFilename } from '@/lib/utils';

/**
 * 포트폴리오 리포트 이미지 업로드 처리 API
 */
export async function POST(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // multipart/form-data 형식으로 전송된 파일 가져오기
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const portfolioType = formData.get('portfolioType') as string;
    
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }
    
    if (!portfolioType) {
      return NextResponse.json({ error: '포트폴리오 유형이 지정되지 않았습니다.' }, { status: 400 });
    }
    
    // 파일명에서 날짜 추출
    const reportDate = extractDateFromFilename(file.name);
    if (!reportDate) {
      return NextResponse.json({ error: '파일명에서 날짜를 추출할 수 없습니다. 파일명에 YYYY-MM-DD 형식의 날짜가 포함되어야 합니다.' }, { status: 400 });
    }
    
    // 파일 확장자 확인
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'jpg' && fileExt !== 'jpeg' && fileExt !== 'png') {
      return NextResponse.json({ error: '지원되지 않는 파일 형식입니다. JPG, JPEG 또는 PNG 파일만 업로드 가능합니다.' }, { status: 400 });
    }
    
    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: '파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.' }, { status: 400 });
    }
    
    // 파일 이름 생성 (포트폴리오 유형 + 날짜 + 확장자)
    const fileName = `${portfolioType.replace(/\s+/g, '-')}_${reportDate.toISOString().split('T')[0]}.${fileExt}`;
    
    // Supabase Storage에 파일 업로드 (서비스 역할 키 사용)
    const { data: fileData, error: uploadError } = await serviceSupabase.storage
      .from('portfolio-reports')
      .upload(fileName, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: true
      });
    
    if (uploadError) {
      console.error('파일 업로드 오류:', uploadError);
      return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다.', details: uploadError.message }, { status: 500 });
    }
    
    // 파일 URL 가져오기
    const { data: urlData } = serviceSupabase.storage
      .from('portfolio-reports')
      .getPublicUrl(fileName);
    
    const fileUrl = urlData.publicUrl;
    
    console.log('포트폴리오 리포트 저장 시도:', {
      portfolio_type: portfolioType,
      report_url: fileUrl,
      report_date: reportDate
    });
    
    try {
      // 데이터베이스에 포트폴리오 리포트 정보 저장 (Drizzle ORM 사용)
      const [report] = await db.insert(portfolioReports).values({
        portfolio_type: portfolioType,
        report_url: fileUrl,
        report_date: reportDate
      }).returning();
      
      console.log('Drizzle ORM으로 저장된 리포트:', report);
      
      // 백업: Supabase 클라이언트로 직접 저장 시도 (서비스 역할 키 사용)
      const { data: supabaseReport, error: insertError } = await serviceSupabase
        .from('portfolio_reports')
        .upsert({
          portfolio_type: portfolioType,
          report_url: fileUrl,
          report_date: reportDate
        })
        .select();
      
      if (insertError) {
        console.error('Supabase 직접 저장 오류:', insertError);
      } else {
        console.log('Supabase 직접 저장 성공:', supabaseReport);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: '포트폴리오 리포트가 성공적으로 업로드되었습니다.',
        data: report || supabaseReport
      });
    } catch (dbError) {
      console.error('데이터베이스 저장 오류:', dbError);
      
      // Drizzle ORM 저장 실패 시 Supabase 클라이언트로 직접 저장 시도
      const { data: supabaseReport, error: insertError } = await serviceSupabase
        .from('portfolio_reports')
        .upsert({
          portfolio_type: portfolioType,
          report_url: fileUrl,
          report_date: reportDate
        })
        .select();
      
      if (insertError) {
        console.error('Supabase 직접 저장 오류:', insertError);
        throw new Error(`데이터베이스 저장 실패: ${(dbError as Error).message}, Supabase 직접 저장 실패: ${insertError.message}`);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: '포트폴리오 리포트가 Supabase에 직접 업로드되었습니다.',
        data: supabaseReport
      });
    }
    
  } catch (error) {
    console.error('포트폴리오 리포트 업로드 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '데이터 처리 중 오류가 발생했습니다.', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 