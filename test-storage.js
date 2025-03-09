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

// 파일 경로
const filePath = 'portfolio-reports/2025/03/_EMP__3.JPG';

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

// 모든 테스트 실행
async function runAllTests() {
  try {
    await testGetPublicUrl();
    await testGetSignedUrl();
    await testUploadNewFile();
    await testUploadWithServiceRole();
    
    console.log('\n모든 테스트가 완료되었습니다.');
  } catch (error) {
    console.error('테스트 실행 중 오류 발생:', error);
  }
}

// 테스트 실행
runAllTests(); 