import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('포트폴리오 파일 업로드 API 시작');
  
  // 환경변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('환경 변수 확인:', {
    'URL 존재': !!supabaseUrl,
    'Service Role Key 존재': !!serviceRoleKey,
    'Service Role Key 길이': serviceRoleKey?.length
  });
  
  if (serviceRoleKey) {
    console.log('Service Key 마지막 문자:', serviceRoleKey.slice(-1), 
                'ASCII 코드:', serviceRoleKey.charCodeAt(serviceRoleKey.length - 1));
  }
  
  try {
    // 요청 헤더에서 인증 토큰 확인
    const authHeader = request.headers.get('Authorization');
    console.log('인증 헤더 존재:', authHeader ? '있음' : '없음');
    
    // 인증 토큰이 없으면 오류 반환
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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 토큰으로 사용자 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenFromHeader);
    
    if (authError || !user) {
      console.error('사용자 검증 실패:', authError || '사용자 정보 없음');
      return NextResponse.json({
        success: false,
        error: '인증에 실패했습니다. 다시 로그인해주세요.'
      }, { status: 401 });
    }
    
    console.log('사용자 검증 성공:', user.id);
    
    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('사용자 정보 조회 오류:', userError);
      return NextResponse.json({
        success: false,
        error: '사용자 정보를 조회할 수 없습니다.'
      }, { status: 500 });
    }
    
    if (!userData || userData.role !== 'admin') {
      console.error('관리자 권한이 없는 사용자:', userData?.role);
      return NextResponse.json({
        success: false,
        error: '관리자 권한이 필요합니다.'
      }, { status: 403 });
    }
    
    // 폼 데이터 처리
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const portfolioType = formData.get('portfolioType') as string;
    const year_month = formData.get('year_month') as string;
    const year = formData.get('year') as string;
    const month = formData.get('month') as string;
    
    console.log('폼 데이터 확인:', {
      파일명: fileName,
      포트폴리오타입: portfolioType,
      연월: year_month,
      연도: year,
      월: month
    });
    
    if (!file || !fileName || !portfolioType || !year_month || !year || !month) {
      return NextResponse.json({
        success: false,
        error: '필수 정보가 누락되었습니다.'
      }, { status: 400 });
    }
    
    // 파일 삭제 및 업로드 로직
    try {
      console.log('파일 업로드/삭제 로직 시작');
      
      // 1. 기존 파일이 있는지 확인
      console.log(`${year}/${month} 경로의 기존 파일 확인 중...`);
      
      const { data: existingFiles, error: listError } = await supabaseAdmin.storage
        .from('portfolio-reports')
        .list(`${year}/${month}`);
      
      if (listError) {
        console.error('기존 파일 확인 오류:', listError);
        // 오류가 있더라도 계속 진행 (폴더가 없을 수 있음)
      }
      
      // 2. 동일한 파일명이 있는지 확인 (대소문자 구분 없이)
      if (existingFiles) {
        const matchingFiles = existingFiles.filter(file => 
          file.name.toLowerCase() === fileName.toLowerCase()
        );
        
        console.log('매칭된 파일:', matchingFiles);
        
        // 3. 기존 파일이 있으면 삭제
        if (matchingFiles.length > 0) {
          console.log('기존 파일 발견, 삭제 시도:', matchingFiles);
          
          for (const file of matchingFiles) {
            const path = `${year}/${month}/${file.name}`;
            console.log(`파일 삭제 시도: ${path}`);
            
            const { error: removeError } = await supabaseAdmin.storage
              .from('portfolio-reports')
              .remove([path]);
              
            if (removeError) {
              console.error(`파일 삭제 오류 (${file.name}):`, removeError);
            } else {
              console.log(`파일 삭제 성공: ${file.name}`);
            }
          }
        }
      }
      
      // 4. 파일 업로드
      console.log(`파일 업로드 시작: ${fileName}`);
      
      try {
        // FormData에서 파일 내용 가져오기
        const fileArrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(fileArrayBuffer);
        
        // 파일 크기 확인 및 로깅
        console.log(`파일 크기: ${fileBuffer.length} 바이트`);
        
        // 파일 타입 확인 및 로깅
        console.log(`파일 타입: ${file.type}`);
        
        // Supabase Storage에 파일 업로드
        const uploadPath = `${year}/${month}/${fileName}`;
        
        // 타임아웃 설정이 있는 업로드 함수
        const uploadWithTimeout = async () => {
          const uploadPromise = supabaseAdmin.storage
            .from('portfolio-reports')
            .upload(uploadPath, fileBuffer, {
              cacheControl: '3600',
              contentType: file.type,
              upsert: true // 파일이 이미 존재할 경우 덮어쓰기
            });
            
          // 60초 타임아웃 설정
          const timeoutPromise = new Promise<{data: any, error: any}>((_, reject) => {
            setTimeout(() => reject(new Error('파일 업로드 시간 초과')), 60000);
          });
          
          return Promise.race([uploadPromise, timeoutPromise]);
        };
        
        const { data: uploadData, error: uploadError } = await uploadWithTimeout();
        
        if (uploadError) {
          console.error('파일 업로드 오류:', uploadError);
          return NextResponse.json({
            success: false,
            error: `파일 업로드 오류: ${uploadError.message}`
          }, { status: 500 });
        }
        
        // 업로드 성공 로그
        console.log('파일 업로드 성공:', uploadData);
        
        // 5. 업로드된 파일 URL 가져오기
        const { data: fileUrlData } = await supabaseAdmin.storage
          .from('portfolio-reports')
          .getPublicUrl(uploadPath);
        
        const fileUrl = fileUrlData?.publicUrl;
        console.log('파일 업로드 완료, URL:', fileUrl);
        
        // 포트폴리오 리포트 데이터는 성공하면 저장 시도
        await savePortfolioReportData(year_month, portfolioType, fileUrl);
        
        // 성공 응답 반환
        return NextResponse.json({
          success: true,
          message: '파일이 성공적으로 업로드되었습니다.',
          file_url: fileUrl
        });
      } catch (uploadError: any) {
        console.error('파일 업로드 중 예외 발생:', uploadError);
        return NextResponse.json({
          success: false,
          error: `파일 업로드 중 예외 발생: ${uploadError.message}`
        }, { status: 500 });
      }
      
    } catch (processError: any) {
      console.error('파일 처리 중 오류:', processError);
      return NextResponse.json({
        success: false,
        error: `파일 처리 중 오류: ${processError.message}`
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('포트폴리오 파일 업로드 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false, 
      error: `데이터 처리 중 오류가 발생했습니다: ${error.message}` 
    }, { status: 500 });
  }
}

// 별도 함수로 분리하여 데이터베이스 저장 부분 모듈화
async function savePortfolioReportData(
  year_month: string,
  portfolioType: string, 
  fileUrl: string
) {
  try {
    // 6. 포트폴리오 타입 ID 조회
    console.log('포트폴리오 타입 ID 조회 중:', portfolioType);
    let portfolioTypeId = null;
    
    // 포트폴리오 타입 이름으로 ID 조회
    const { data: portfolioTypeData, error: portfolioTypeError } = await supabaseAdmin
      .from('portfolio_types')
      .select('id')
      .eq('name', portfolioType)
      .maybeSingle();
    
    if (portfolioTypeError) {
      console.error('포트폴리오 타입 ID 조회 오류:', portfolioTypeError);
      return;
    }
    
    // 포트폴리오 타입이 없는 경우 생성
    if (!portfolioTypeData) {
      console.log('포트폴리오 타입이 없어 생성합니다:', portfolioType);
      
      const { data: newPortfolioType, error: createError } = await supabaseAdmin
        .from('portfolio_types')
        .insert({
          name: portfolioType,
          description: `${portfolioType} 포트폴리오`
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('포트폴리오 타입 생성 오류:', createError);
        return;
      } else {
        portfolioTypeId = newPortfolioType.id;
        console.log('포트폴리오 타입 생성 성공:', portfolioTypeId);
      }
    } else {
      portfolioTypeId = portfolioTypeData.id;
      console.log('포트폴리오 타입 ID 조회 성공:', portfolioTypeId);
    }
    
    // 7. 포트폴리오 리포트 데이터 저장/갱신
    if (portfolioTypeId) {
      console.log('포트폴리오 리포트 데이터 저장 시도:', { year_month, portfolioTypeId });
      
      // 기존 데이터 확인
      const { data: existingReport, error: findError } = await supabaseAdmin
        .from('portfolio_reports')
        .select('id')
        .eq('year_month', year_month)
        .eq('portfolio_type_id', portfolioTypeId)
        .maybeSingle();
      
      if (findError) {
        console.error('기존 포트폴리오 리포트 확인 오류:', findError);
        return;
      }
      
      if (existingReport) {
        // 기존 데이터 업데이트
        console.log('기존 포트폴리오 리포트 업데이트:', existingReport.id);
        
        // 테이블 구조 확인
        console.log('포트폴리오 리포트 테이블 구조 확인을 위한 조회 시도');
        const { data: tableInfo, error: tableError } = await supabaseAdmin
          .from('portfolio_reports')
          .select('*')
          .eq('id', existingReport.id)
          .single();
        
        console.log('테이블 구조 정보:', tableInfo ? Object.keys(tableInfo) : '정보 없음', tableError ? `오류: ${tableError.message}` : '오류 없음');
        
        // 업데이트 데이터 객체
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString(),
          report_url: fileUrl  // report_url 필드에 저장
        };
        
        const { error: updateError } = await supabaseAdmin
          .from('portfolio_reports')
          .update(updateData)
          .eq('id', existingReport.id);
        
        if (updateError) {
          console.error('포트폴리오 리포트 업데이트 오류:', updateError);
        } else {
          console.log('포트폴리오 리포트 업데이트 성공');
        }
      } else {
        // 새 데이터 삽입
        console.log('새 포트폴리오 리포트 생성');
        
        // 현재 날짜 설정
        const currentDate = new Date();
        
        // 삽입할 데이터 객체
        const insertData: Record<string, any> = {
          year_month,
          portfolio_type_id: portfolioTypeId,
          report_url: fileUrl,  // report_url 필드에 저장
          report_date: currentDate.toISOString(),
          portfolio_type: portfolioType  // 레거시 지원을 위해 포함
        };
        
        const { error: insertError } = await supabaseAdmin
          .from('portfolio_reports')
          .insert(insertData);
        
        if (insertError) {
          console.error('포트폴리오 리포트 생성 오류:', insertError);
        } else {
          console.log('포트폴리오 리포트 생성 성공');
        }
      }
    }
  } catch (error) {
    console.error('데이터 저장 중 오류:', error);
  }
} 