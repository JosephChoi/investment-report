import { NextRequest, NextResponse } from 'next/server';
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
          error: '관리자만 포트폴리오 파일을 업로드할 수 있습니다.',
        },
        { status: 403 }
      );
    }
    
    // 폼 데이터 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const portfolioType = formData.get('portfolioType') as string;
    const year_month = formData.get('year_month') as string;
    const year = formData.get('year') as string;
    const month = formData.get('month') as string;
    
    console.log('포트폴리오 파일 업로드 API 호출:', { 
      fileName, 
      portfolioType, 
      year_month 
    });
    
    if (!file || !fileName || !portfolioType || !year_month || !year || !month) {
      return NextResponse.json({ 
        success: false, 
        error: '파일, 파일명, 포트폴리오 타입, 연월 정보가 필요합니다.' 
      }, { status: 400 });
    }
    
    // 포트폴리오 타입 ID 조회
    console.log('포트폴리오 타입 ID 조회 중:', portfolioType);
    let portfolioTypeId = null;
    
    // 포트폴리오 타입 이름으로 ID 조회
    const { data: portfolioTypeData, error: portfolioTypeError } = await supabaseAdmin
      .from('portfolio_types')
      .select('id, name')
      .eq('name', portfolioType)
      .maybeSingle();
      
    if (portfolioTypeError) {
      console.error('포트폴리오 타입 ID 조회 오류:', portfolioTypeError);
      return NextResponse.json({ 
        success: false, 
        error: `포트폴리오 타입 ID 조회 오류: ${portfolioTypeError.message}` 
      }, { status: 500 });
    }
    
    if (!portfolioTypeData) {
      console.log('포트폴리오 타입을 찾을 수 없어 새로 생성합니다:', portfolioType);
      
      // 포트폴리오 타입이 없는 경우 새로 생성
      const { data: newPortfolioType, error: createError } = await supabaseAdmin
        .from('portfolio_types')
        .insert({
          name: portfolioType,
          description: `${portfolioType} 포트폴리오`
        })
        .select('id');
        
      if (createError) {
        console.error('포트폴리오 타입 생성 오류:', createError);
        return NextResponse.json({ 
          success: false, 
          error: `포트폴리오 타입 생성 오류: ${createError.message}` 
        }, { status: 500 });
      }
      
      if (!newPortfolioType || newPortfolioType.length === 0) {
        console.error('포트폴리오 타입 생성 후 ID를 가져올 수 없습니다.');
        return NextResponse.json({ 
          success: false, 
          error: '포트폴리오 타입 생성 후 ID를 가져올 수 없습니다.' 
        }, { status: 500 });
      }
      
      portfolioTypeId = newPortfolioType[0].id;
      console.log('새로운 포트폴리오 타입 생성 성공:', { id: portfolioTypeId, name: portfolioType });
    } else {
      portfolioTypeId = portfolioTypeData.id;
      console.log('포트폴리오 타입 ID 조회 성공:', { id: portfolioTypeId, name: portfolioType });
    }
    
    // 포트폴리오 타입에 따라 영문 파일명 생성
    let englishFileName = '';
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const portfolioTypeLower = portfolioType.toLowerCase();
    
    // 파일명에서 특수 문자 및 공백 제거
    const sanitizeFileName = (name: string) => {
      // 공백을 언더스코어로 변경하고 특수 문자 제거
      return name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
    };
    
    // 포트폴리오 타입에 따라 명확한 영문 파일명 생성
    // 더 구체적인 타입을 먼저 확인 (순서 중요)
    if (portfolioTypeLower.includes('국내') && portfolioTypeLower.includes('적립식') && portfolioTypeLower.includes('etf')) {
      englishFileName = `domestic_savings_etf_${month}.${fileExt}`;
    } else if (portfolioTypeLower.includes('국내') && portfolioTypeLower.includes('etf')) {
      englishFileName = `domestic_etf_${month}.${fileExt}`;
    } else if (portfolioTypeLower.includes('연금') && portfolioTypeLower.includes('적립식')) {
      englishFileName = `pension_savings_${month}.${fileExt}`;
    } else if (portfolioTypeLower.includes('연금') || portfolioTypeLower.includes('irp')) {
      englishFileName = `pension_${month}.${fileExt}`;
    } else if (portfolioTypeLower.includes('적립식')) {
      englishFileName = `savings_${month}.${fileExt}`;
    } else if (portfolioTypeLower.includes('isa')) {
      englishFileName = `isa_${month}.${fileExt}`;
    } else if (portfolioTypeLower.includes('bdc') || portfolioTypeLower.includes('배당')) {
      englishFileName = `dividend_${month}.${fileExt}`;
    } else if (portfolioTypeLower.includes('채권')) {
      englishFileName = `bond_${month}.${fileExt}`;
    } else if (portfolioTypeLower.includes('글로벌') || portfolioTypeLower.includes('해외')) {
      englishFileName = `global_${month}.${fileExt}`;
    } else {
      // 기본값: 포트폴리오 타입을 영문화하여 사용
      englishFileName = `portfolio_${sanitizeFileName(portfolioType)}_${month}.${fileExt}`;
    }
    
    // 최종 파일명 정리 (안전한 파일명으로 변환)
    englishFileName = sanitizeFileName(englishFileName);
    
    // 파일 경로 생성 (영문 파일명 사용)
    // 중첩 구조 제거: 단일 경로 구조만 사용
    const filePath = `${year}/${month}/${englishFileName}`;
    
    console.log('생성된 영문 파일명:', englishFileName);
    console.log('파일 경로:', filePath);
    
    // 기존 파일 삭제 및 업로드 함수
    const deleteAndUploadFile = async () => {
      try {
        // 1. 기존 파일이 있는지 확인 (두 가지 가능한 경로 모두 확인)
        console.log('기존 파일 확인 중...');
        
        // 첫 번째 경로 확인 (year/month/...)
        const { data: existingFiles1, error: listError1 } = await supabaseAdmin.storage
          .from('portfolio-reports')
          .list(`${year}/${month}`);
          
        // 두 번째 경로 확인 (portfolio-reports/year/month/...) - 이전 중첩 구조
        const { data: existingFiles2, error: listError2 } = await supabaseAdmin.storage
          .from('portfolio-reports')
          .list(`portfolio-reports/${year}/${month}`);
          
        if (listError1) {
          console.error('기존 파일 확인 오류 (첫 번째 경로):', listError1);
        }
        
        if (listError2) {
          console.error('기존 파일 확인 오류 (두 번째 경로):', listError2);
        }
        
        // 2. 두 경로에서 동일한 파일명이 있는지 확인 (대소문자 구분 없이)
        const matchingFiles1 = existingFiles1?.filter(file => 
          file.name.toLowerCase() === englishFileName.toLowerCase()
        ) || [];
        
        const matchingFiles2 = existingFiles2?.filter(file => 
          file.name.toLowerCase() === englishFileName.toLowerCase()
        ) || [];
        
        console.log('첫 번째 경로 매칭 파일:', matchingFiles1);
        console.log('두 번째 경로 매칭 파일:', matchingFiles2);
        
        // 3. 첫 번째 경로에서 매칭된 파일이 있으면 삭제
        if (matchingFiles1 && matchingFiles1.length > 0) {
          console.log('첫 번째 경로에서 기존 파일 발견, 삭제 시도:', matchingFiles1);
          
          for (const file of matchingFiles1) {
            const path = `${year}/${month}/${file.name}`;
            console.log(`파일 삭제 시도 (첫 번째 경로): ${path}`);
            
            const { error: removeError } = await supabaseAdmin.storage
              .from('portfolio-reports')
              .remove([path]);
              
            if (removeError) {
              console.error(`파일 삭제 오류 (첫 번째 경로, ${file.name}):`, removeError);
            } else {
              console.log(`파일 삭제 성공 (첫 번째 경로): ${file.name}`);
            }
          }
        }
        
        // 4. 두 번째 경로에서 매칭된 파일이 있으면 삭제
        if (matchingFiles2 && matchingFiles2.length > 0) {
          console.log('두 번째 경로에서 기존 파일 발견, 삭제 시도:', matchingFiles2);
          
          for (const file of matchingFiles2) {
            const path = `portfolio-reports/${year}/${month}/${file.name}`;
            console.log(`파일 삭제 시도 (두 번째 경로): ${path}`);
            
            const { error: removeError } = await supabaseAdmin.storage
              .from('portfolio-reports')
              .remove([path]);
              
            if (removeError) {
              console.error(`파일 삭제 오류 (두 번째 경로, ${file.name}):`, removeError);
            } else {
              console.log(`파일 삭제 성공 (두 번째 경로): ${file.name}`);
            }
          }
        }
        
        // 5. 삭제 후 충분한 지연 시간 추가 (3초)
        console.log('파일 삭제 후 지연 중...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 파일 유효성 검사
        console.log('파일 유효성 검사 중...');
        if (!file) {
          console.error('파일이 없습니다.');
          return { success: false, error: new Error('파일이 없습니다.') };
        }
        
        if (file.size === 0) {
          console.error('파일 크기가 0입니다.');
          return { success: false, error: new Error('파일 크기가 0입니다.') };
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB 제한
          console.error('파일 크기가 너무 큽니다:', file.size);
          return { success: false, error: new Error('파일 크기가 10MB를 초과합니다.') };
        }
        
        // 6. 새 파일 업로드 (단일 경로만 사용)
        console.log('새 파일 업로드 시작...');
        
        // 최대 3번 재시도
        let uploadAttempt = 0;
        const maxAttempts = 3;
        
        while (uploadAttempt < maxAttempts) {
          uploadAttempt++;
          console.log(`업로드 시도 ${uploadAttempt}/${maxAttempts}...`);
          
          try {
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from('portfolio-reports')
              .upload(filePath, file, {
                upsert: true,
                cacheControl: 'no-cache',
                contentType: file.type || 'image/jpeg' // 명시적으로 Content-Type 설정
              });
              
            if (uploadError) {
              console.error(`업로드 시도 ${uploadAttempt} 실패:`, uploadError);
              
              // 업로드 오류 상세 정보 로깅
              if (uploadError.message) {
                console.error('업로드 오류 메시지:', uploadError.message);
              }
              
              // 파일 정보 로깅
              console.log('파일 정보:', {
                name: file.name,
                size: file.size,
                type: file.type
              });
              
              // 마지막 시도가 아니면 잠시 대기 후 재시도
              if (uploadAttempt < maxAttempts) {
                const waitTime = 2000 * uploadAttempt; // 점진적으로 대기 시간 증가
                console.log(`${waitTime}ms 후 재시도...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
              
              return { success: false, error: uploadError };
            }
            
            console.log('파일 업로드 성공:', uploadData);
            return { success: true, data: uploadData, path: filePath };
          } catch (uploadException) {
            console.error(`업로드 시도 ${uploadAttempt} 중 예외 발생:`, uploadException);
            
            // 마지막 시도가 아니면 잠시 대기 후 재시도
            if (uploadAttempt < maxAttempts) {
              const waitTime = 2000 * uploadAttempt; // 점진적으로 대기 시간 증가
              console.log(`${waitTime}ms 후 재시도...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            
            return { success: false, error: uploadException };
          }
        }
        
        // 모든 시도 실패
        return { success: false, error: new Error('최대 시도 횟수를 초과했습니다.') };
      } catch (error) {
        console.error('파일 삭제 및 업로드 중 예외 발생:', error);
        return { success: false, error };
      }
    };
    
    // 파일 삭제 및 업로드 실행
    const uploadResult = await deleteAndUploadFile();
    
    if (!uploadResult.success) {
      // 오류 정보 상세화
      let errorMessage = '파일 업로드 오류';
      
      if (uploadResult.error instanceof Error) {
        errorMessage += `: ${uploadResult.error.message}`;
      } else if (typeof uploadResult.error === 'object' && uploadResult.error !== null) {
        // Supabase 오류 객체인 경우
        const supabaseError = uploadResult.error as any;
        if (supabaseError.message) {
          errorMessage += `: ${supabaseError.message}`;
        }
        if (supabaseError.details) {
          errorMessage += ` (${supabaseError.details})`;
        }
        if (supabaseError.hint) {
          errorMessage += ` - 힌트: ${supabaseError.hint}`;
        }
      }
      
      console.error('최종 오류 응답:', errorMessage);
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        originalError: uploadResult.error
      }, { status: 500 });
    }
    
    // 공개 URL 생성 (업로드된 경로 사용)
    const { data: urlData } = supabaseAdmin.storage
      .from('portfolio-reports')
      .getPublicUrl(uploadResult.path || filePath);
      
    if (!urlData || !urlData.publicUrl) {
      return NextResponse.json({ 
        success: false, 
        error: '파일 URL을 가져올 수 없습니다.' 
      }, { status: 500 });
    }
    
    // 포트폴리오 리포트 정보 저장
    // 먼저 기존 데이터가 있는지 확인
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('portfolio_reports')
      .select('id')
      .eq('year_month', year_month)
      .eq('portfolio_type_id', portfolioTypeId)
      .maybeSingle();
      
    let reportData;
    let reportError;
    
    if (existingData) {
      // 기존 데이터가 있으면 업데이트
      const result = await supabaseAdmin
        .from('portfolio_reports')
        .update({
          report_url: urlData.publicUrl,
          report_date: new Date().toISOString()
        })
        .eq('id', existingData.id)
        .select();
        
      reportData = result.data;
      reportError = result.error;
    } else {
      // 기존 데이터가 없으면 새로 삽입
      const result = await supabaseAdmin
        .from('portfolio_reports')
        .insert({
          year_month,
          portfolio_type_id: portfolioTypeId,
          portfolio_type: portfolioType, // 호환성을 위해 유지
          report_url: urlData.publicUrl,
          report_date: new Date().toISOString()
        })
        .select();
        
      reportData = result.data;
      reportError = result.error;
    }
    
    if (reportError) {
      console.error('포트폴리오 리포트 정보 저장 오류:', reportError);
      return NextResponse.json({ 
        success: false, 
        error: `포트폴리오 리포트 정보 저장 오류: ${reportError.message}` 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        file: uploadResult.data,
        report: reportData,
        filePath: uploadResult.path || filePath,
        englishFileName: englishFileName,
        portfolioTypeId: portfolioTypeId
      }
    });
    
  } catch (error: any) {
    console.error('포트폴리오 파일 업로드 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false, 
      error: `데이터 처리 중 오류가 발생했습니다: ${error.message}` 
    }, { status: 500 });
  }
} 