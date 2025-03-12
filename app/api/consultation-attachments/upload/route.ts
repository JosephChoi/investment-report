import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 서비스 역할 키를 사용하는 Supabase 클라이언트 가져오기
    const serviceSupabase = getServiceSupabase();
    
    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const consultationId = formData.get('consultationId') as string;
    
    console.log('상담 첨부 파일 업로드 API 호출:', { 
      fileName: file?.name, 
      fileSize: file?.size,
      consultationId 
    });
    
    if (!file || !consultationId) {
      return NextResponse.json({ 
        success: false, 
        error: '파일과 상담 ID가 필요합니다.' 
      }, { status: 400 });
    }
    
    // 파일 경로 생성
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${consultationId}/${fileName}`;
    
    console.log('파일 경로:', filePath);
    
    // 파일 업로드 - 버킷 이름을 'consultations'로 변경
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('consultations')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error('파일 업로드 오류:', uploadError);
      return NextResponse.json({ 
        success: false, 
        error: uploadError.message 
      }, { status: 500 });
    }
    
    // 파일 URL 생성 (file_url 필드를 위해)
    const { data: urlData, error: urlError } = await serviceSupabase.storage
      .from('consultations')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1년 유효한 URL
    
    if (urlError) {
      console.error('파일 URL 생성 오류:', urlError);
      
      // 업로드된 파일 삭제 시도
      await serviceSupabase.storage
        .from('consultations')
        .remove([filePath]);
      
      return NextResponse.json({ 
        success: false, 
        error: urlError.message 
      }, { status: 500 });
    }
    
    const fileUrl = urlData.signedUrl;
    console.log('생성된 파일 URL:', fileUrl);
    
    // 테이블 구조 확인을 위해 먼저 테이블 정보 조회
    const { data: tableInfo, error: tableError } = await serviceSupabase
      .from('consultation_attachments')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('테이블 정보 조회 오류:', tableError);
    } else {
      console.log('테이블 구조 확인:', tableInfo);
    }
    
    // DB에 파일 정보 저장 - 필수 필드 추가
    const insertData: any = {
      consultation_id: consultationId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: fileUrl // 필수 필드 추가
    };
    
    // file_path 필드가 있는지 확인하고 있으면 추가
    if (tableInfo && tableInfo.length > 0 && 'file_path' in tableInfo[0]) {
      insertData.file_path = filePath;
    }
    
    console.log('삽입할 데이터:', insertData);
    
    const { data: dbData, error: dbError } = await serviceSupabase
      .from('consultation_attachments')
      .insert(insertData)
      .select();
    
    if (dbError) {
      console.error('파일 정보 저장 오류:', dbError);
      
      // 업로드된 파일 삭제 시도
      await serviceSupabase.storage
        .from('consultations')
        .remove([filePath]);
      
      return NextResponse.json({ 
        success: false, 
        error: dbError.message 
      }, { status: 500 });
    }
    
    console.log('파일 업로드 및 정보 저장 성공:', dbData);
    
    return NextResponse.json({ 
      success: true, 
      data: dbData[0]
    });
  } catch (error) {
    console.error('상담 첨부 파일 업로드 API 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 