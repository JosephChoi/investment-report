// Supabase 스토리지 테스트 스크립트
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 환경 변수 로드 (.env.local 파일 사용)
dotenv.config({ path: '.env.local' });

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL 또는 Anon Key가 설정되지 않았습니다.');
  process.exit(1);
}

// 일반 클라이언트 (익명 키 사용)
const supabase = createClient(supabaseUrl, supabaseKey);

// 서비스 역할 클라이언트 (서비스 역할 키 사용, 있는 경우)
const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// 버킷 이름
const bucketName = 'portfolio-reports';

// 파일 경로 (중첩 구조 제거)
const filePath = '2025/03/_EMP__3.JPG';

// 0. 버킷 구조 확인 테스트
async function testBucketStructure() {
  console.log('\n0. 버킷 구조 확인 테스트');
  
  // 루트 경로 확인
  console.log('루트 경로 확인:');
  const { data: rootData, error: rootError } = await supabaseAdmin
    .storage
    .from(bucketName)
    .list('');
    
  if (rootError) {
    console.error('루트 경로 확인 오류:', rootError);
  } else {
    console.log('루트 경로 내용:', rootData);
  }
  
  // 2025 폴더 확인
  console.log('\n2025 폴더 확인:');
  const { data: yearData, error: yearError } = await supabaseAdmin
    .storage
    .from(bucketName)
    .list('2025');
    
  if (yearError) {
    console.error('2025 폴더 확인 오류:', yearError);
  } else {
    console.log('2025 폴더 내용:', yearData);
  }
  
  // 2025/03 폴더 확인
  console.log('\n2025/03 폴더 확인:');
  const { data: monthData, error: monthError } = await supabaseAdmin
    .storage
    .from(bucketName)
    .list('2025/03');
    
  if (monthError) {
    console.error('2025/03 폴더 확인 오류:', monthError);
  } else {
    console.log('2025/03 폴더 내용:', monthData);
  }
  
  // portfolio-reports 폴더 확인
  console.log('\nportfolio-reports 폴더 확인:');
  const { data: prData, error: prError } = await supabaseAdmin
    .storage
    .from(bucketName)
    .list('portfolio-reports');
    
  if (prError) {
    console.error('portfolio-reports 폴더 확인 오류:', prError);
  } else {
    console.log('portfolio-reports 폴더 내용:', prData);
  }
  
  // portfolio-reports/2025 폴더 확인
  console.log('\nportfolio-reports/2025 폴더 확인:');
  const { data: prYearData, error: prYearError } = await supabaseAdmin
    .storage
    .from(bucketName)
    .list('portfolio-reports/2025');
    
  if (prYearError) {
    console.error('portfolio-reports/2025 폴더 확인 오류:', prYearError);
  } else {
    console.log('portfolio-reports/2025 폴더 내용:', prYearData);
  }
  
  // portfolio-reports/2025/03 폴더 확인
  console.log('\nportfolio-reports/2025/03 폴더 확인:');
  const { data: prMonthData, error: prMonthError } = await supabaseAdmin
    .storage
    .from(bucketName)
    .list('portfolio-reports/2025/03');
    
  if (prMonthError) {
    console.error('portfolio-reports/2025/03 폴더 확인 오류:', prMonthError);
  } else {
    console.log('portfolio-reports/2025/03 폴더 내용:', prMonthData);
  }
}

// 1. 공개 URL 가져오기 테스트
async function testGetPublicUrl() {
  console.log('1. 공개 URL 가져오기 테스트');
  
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .getPublicUrl(filePath);
    
  if (error) {
    console.error('공개 URL 가져오기 오류:', error);
  } else {
    console.log('공개 URL:', data.publicUrl);
    
    // URL이 유효한지 확인
    try {
      const response = await fetch(data.publicUrl, { method: 'HEAD' });
      console.log('URL 유효성 검사 결과:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('URL 유효성 검사 중 오류:', fetchError);
    }
  }
}

// 2. 서명된 URL 가져오기 테스트
async function testGetSignedUrl() {
  console.log('\n2. 서명된 URL 가져오기 테스트');
  
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .createSignedUrl(filePath, 60); // 60초 유효
    
  if (error) {
    console.error('서명된 URL 가져오기 오류:', error);
  } else {
    console.log('서명된 URL:', data.signedUrl);
    
    // URL이 유효한지 확인
    try {
      const response = await fetch(data.signedUrl, { method: 'HEAD' });
      console.log('URL 유효성 검사 결과:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('URL 유효성 검사 중 오류:', fetchError);
    }
  }
}

// 3. 새 파일 업로드 테스트
async function testUploadNewFile() {
  console.log('\n3. 새 파일 업로드 테스트');
  
  // 테스트 파일 생성
  const testFilePath = path.join(process.cwd(), 'test-image.txt');
  fs.writeFileSync(testFilePath, 'This is a test file content');
  
  const newFilePath = 'test-files/test-image-' + Date.now() + '.txt';
  
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .upload(newFilePath, fs.readFileSync(testFilePath), {
      contentType: 'text/plain',
      upsert: true
    });
    
  if (error) {
    console.error('파일 업로드 오류:', error);
  } else {
    console.log('파일 업로드 성공:', data);
    
    // 업로드된 파일의 URL 가져오기
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(newFilePath);
      
    console.log('업로드된 파일 URL:', urlData.publicUrl);
    
    // URL이 유효한지 확인
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      console.log('URL 유효성 검사 결과:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('URL 유효성 검사 중 오류:', fetchError);
    }
  }
  
  // 테스트 파일 삭제
  fs.unlinkSync(testFilePath);
}

// 4. 서비스 역할 키로 파일 업로드 테스트 (있는 경우)
async function testUploadWithServiceRole() {
  if (!supabaseAdmin) {
    console.log('\n4. 서비스 역할 키로 파일 업로드 테스트: 서비스 역할 키가 없습니다.');
    return;
  }
  
  console.log('\n4. 서비스 역할 키로 파일 업로드 테스트');
  
  // 테스트 파일 생성
  const testFilePath = path.join(process.cwd(), 'test-image-admin.txt');
  fs.writeFileSync(testFilePath, 'This is a test file content (admin)');
  
  const newFilePath = 'test-files/test-image-admin-' + Date.now() + '.txt';
  
  const { data, error } = await supabaseAdmin
    .storage
    .from(bucketName)
    .upload(newFilePath, fs.readFileSync(testFilePath), {
      contentType: 'text/plain',
      upsert: true
    });
    
  if (error) {
    console.error('파일 업로드 오류 (서비스 역할):', error);
  } else {
    console.log('파일 업로드 성공 (서비스 역할):', data);
    
    // 업로드된 파일의 URL 가져오기
    const { data: urlData } = await supabaseAdmin
      .storage
      .from(bucketName)
      .getPublicUrl(newFilePath);
      
    console.log('업로드된 파일 URL (서비스 역할):', urlData.publicUrl);
    
    // URL이 유효한지 확인
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      console.log('URL 유효성 검사 결과 (서비스 역할):', response.status, response.statusText);
    } catch (fetchError) {
      console.error('URL 유효성 검사 중 오류 (서비스 역할):', fetchError);
    }
  }
  
  // 테스트 파일 삭제
  fs.unlinkSync(testFilePath);
}

// 5. 파일 덮어쓰기 테스트
async function testFileOverwrite() {
  console.log('\n5. 파일 덮어쓰기 테스트');
  
  // 테스트 파일 경로 (중첩 구조 제거)
  const testFilePath = '2025/03/test_overwrite.txt';
  
  // 첫 번째 파일 내용
  const content1 = 'First file content - ' + Date.now();
  
  // 첫 번째 파일 업로드
  console.log('첫 번째 파일 업로드 중...');
  const { data: uploadData1, error: uploadError1 } = await supabaseAdmin
    .storage
    .from(bucketName)
    .upload(testFilePath, content1, {
      contentType: 'text/plain',
      upsert: true
    });
    
  if (uploadError1) {
    console.error('첫 번째 파일 업로드 오류:', uploadError1);
    return;
  }
  
  console.log('첫 번째 파일 업로드 성공:', uploadData1);
  
  // 파일 URL 가져오기
  const { data: urlData1 } = await supabaseAdmin
    .storage
    .from(bucketName)
    .getPublicUrl(testFilePath);
    
  console.log('첫 번째 파일 URL:', urlData1.publicUrl);
  
  // 2초 대기
  console.log('2초 대기 중...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 두 번째 파일 내용
  const content2 = 'Second file content - ' + Date.now();
  
  // 기존 파일 삭제
  console.log('기존 파일 삭제 중...');
  const { error: removeError } = await supabaseAdmin
    .storage
    .from(bucketName)
    .remove([testFilePath]);
    
  if (removeError) {
    console.error('파일 삭제 오류:', removeError);
  } else {
    console.log('파일 삭제 성공');
  }
  
  // 2초 대기
  console.log('2초 대기 중...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 두 번째 파일 업로드
  console.log('두 번째 파일 업로드 중...');
  const { data: uploadData2, error: uploadError2 } = await supabaseAdmin
    .storage
    .from(bucketName)
    .upload(testFilePath, content2, {
      contentType: 'text/plain',
      upsert: true,
      cacheControl: 'no-cache'
    });
    
  if (uploadError2) {
    console.error('두 번째 파일 업로드 오류:', uploadError2);
    return;
  }
  
  console.log('두 번째 파일 업로드 성공:', uploadData2);
  
  // 파일 URL 가져오기
  const { data: urlData2 } = await supabaseAdmin
    .storage
    .from(bucketName)
    .getPublicUrl(testFilePath);
    
  console.log('두 번째 파일 URL:', urlData2.publicUrl);
  
  // 파일 내용 확인
  try {
    console.log('파일 내용 확인 중...');
    const response = await fetch(urlData2.publicUrl + '?t=' + Date.now());
    const content = await response.text();
    console.log('파일 내용:', content);
    
    if (content === content2) {
      console.log('파일 덮어쓰기 성공!');
    } else {
      console.error('파일 덮어쓰기 실패! 기존 내용이 그대로 유지됨');
    }
  } catch (fetchError) {
    console.error('파일 내용 확인 중 오류:', fetchError);
  }
}

// 6. 특정 파일 강제 삭제 테스트
async function testForceDeleteFile(filePathToDelete = 'portfolio-reports/2025/03/pension_savings_03.jpg') {
  console.log('\n6. 특정 파일 강제 삭제 테스트');
  
  console.log(`파일 삭제 시도: ${filePathToDelete}`);
  
  // 파일 삭제
  const { error: removeError } = await supabaseAdmin
    .storage
    .from(bucketName)
    .remove([filePathToDelete]);
    
  if (removeError) {
    console.error('파일 삭제 오류:', removeError);
    
    // 다른 경로 시도
    const alternativePath = filePathToDelete.startsWith('portfolio-reports/') 
      ? filePathToDelete.substring('portfolio-reports/'.length) 
      : 'portfolio-reports/' + filePathToDelete;
      
    console.log(`대체 경로로 삭제 시도: ${alternativePath}`);
    
    const { error: altRemoveError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .remove([alternativePath]);
      
    if (altRemoveError) {
      console.error('대체 경로 삭제 오류:', altRemoveError);
    } else {
      console.log('대체 경로 삭제 성공');
    }
  } else {
    console.log('파일 삭제 성공');
  }
}

// 7. 스토리지 내 모든 파일 및 폴더 삭제 테스트
async function cleanupStorage() {
  console.log('\n7. 스토리지 내 모든 파일 및 폴더 삭제 테스트');
  
  // 삭제할 경로 목록
  const pathsToClean = [
    // 중첩 구조 경로
    'portfolio-reports/2025/03',
    'portfolio-reports/2025',
    'portfolio-reports',
    // 정상 경로
    '2025/03',
    '2025',
    // 테스트 파일 경로
    'test-files'
  ];
  
  for (const path of pathsToClean) {
    console.log(`\n경로 ${path} 내 파일 목록 조회 중...`);
    
    try {
      // 해당 경로의 파일 목록 조회
      const { data: files, error: listError } = await supabaseAdmin
        .storage
        .from(bucketName)
        .list(path);
        
      if (listError) {
        console.error(`경로 ${path} 목록 조회 오류:`, listError);
        continue;
      }
      
      if (!files || files.length === 0) {
        console.log(`경로 ${path}에 파일이 없습니다.`);
        continue;
      }
      
      console.log(`경로 ${path}에서 ${files.length}개 파일/폴더 발견:`, files.map(f => f.name));
      
      // 파일만 필터링 (폴더는 metadata가 null)
      const filesToDelete = files
        .filter(file => file.metadata)
        .map(file => `${path}/${file.name}`);
        
      if (filesToDelete.length > 0) {
        console.log(`${filesToDelete.length}개 파일 삭제 시도:`, filesToDelete);
        
        const { error: deleteError } = await supabaseAdmin
          .storage
          .from(bucketName)
          .remove(filesToDelete);
          
        if (deleteError) {
          console.error(`파일 삭제 오류:`, deleteError);
        } else {
          console.log(`${filesToDelete.length}개 파일 삭제 성공`);
        }
      }
      
      // 하위 폴더 처리 (재귀적으로 처리)
      const subFolders = files
        .filter(file => !file.metadata)
        .map(folder => `${path}/${folder.name}`);
        
      for (const subFolder of subFolders) {
        console.log(`하위 폴더 ${subFolder} 처리 중...`);
        
        // 하위 폴더의 파일 목록 조회
        const { data: subFiles, error: subListError } = await supabaseAdmin
          .storage
          .from(bucketName)
          .list(subFolder);
          
        if (subListError) {
          console.error(`하위 폴더 ${subFolder} 목록 조회 오류:`, subListError);
          continue;
        }
        
        if (!subFiles || subFiles.length === 0) {
          console.log(`하위 폴더 ${subFolder}에 파일이 없습니다.`);
          continue;
        }
        
        // 하위 폴더의 파일 삭제
        const subFilesToDelete = subFiles
          .filter(file => file.metadata)
          .map(file => `${subFolder}/${file.name}`);
          
        if (subFilesToDelete.length > 0) {
          console.log(`${subFilesToDelete.length}개 하위 파일 삭제 시도:`, subFilesToDelete);
          
          const { error: subDeleteError } = await supabaseAdmin
            .storage
            .from(bucketName)
            .remove(subFilesToDelete);
            
          if (subDeleteError) {
            console.error(`하위 파일 삭제 오류:`, subDeleteError);
          } else {
            console.log(`${subFilesToDelete.length}개 하위 파일 삭제 성공`);
          }
        }
      }
    } catch (error) {
      console.error(`경로 ${path} 처리 중 오류:`, error);
    }
  }
  
  console.log('\n스토리지 정리 완료');
}

// 8. 포트폴리오 리포트 테이블 데이터 삭제 테스트
async function cleanupDatabase() {
  console.log('\n8. 포트폴리오 리포트 테이블 데이터 삭제 테스트');
  
  try {
    // 모든 포트폴리오 리포트 데이터 삭제
    const { error } = await supabaseAdmin
      .from('portfolio_reports')
      .delete()
      .gte('id', 0); // 모든 행 삭제
      
    if (error) {
      console.error('포트폴리오 리포트 데이터 삭제 오류:', error);
    } else {
      console.log('포트폴리오 리포트 데이터 삭제 성공');
    }
  } catch (error) {
    console.error('데이터베이스 정리 중 오류:', error);
  }
}

// 모든 테스트 실행
async function runAllTests() {
  try {
    // 테스트 실행
    await testBucketStructure();
    await testGetPublicUrl();
    await testGetSignedUrl();
    await testUploadNewFile();
    
    if (supabaseAdmin) {
      await testUploadWithServiceRole();
      await testFileOverwrite();
      await testForceDeleteFile(process.argv[2]);
    }
    
    // 정리 함수 실행
    await cleanupStorage();
    await cleanupDatabase();
    
    console.log('\n모든 테스트가 완료되었습니다.');
  } catch (error) {
    console.error('테스트 실행 중 오류 발생:', error);
  }
}

// 명령줄 인수 처리
if (process.argv.length > 2) {
  const arg = process.argv[2];
  
  if (arg === 'cleanup') {
    // 정리 함수만 실행
    (async () => {
      await cleanupStorage();
      await cleanupDatabase();
      console.log('\n정리 작업이 완료되었습니다.');
    })();
  } else {
    // 특정 파일 삭제 테스트 실행
    testForceDeleteFile(arg);
  }
} else {
  // 모든 테스트 실행
  runAllTests();
} 