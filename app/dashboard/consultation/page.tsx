'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Calendar, FileText, X, ChevronLeft, ChevronRight } from 'lucide-react';
// 파일 뷰어 컴포넌트 임포트
import FileViewer from '@/components/file-viewer';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

// 상담 내역 타입 정의
interface Consultation {
  id: string;
  user_id: string;
  title: string;
  content: string;
  consultation_date: string;
  created_at: string;
  updated_at?: string;
  reference_url?: string;
  consultation_attachments?: {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
  }[];
}

export default function ConsultationPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  
  // 페이지네이션 상태
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);

  // URL 파라미터 확인
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const previewParam = params.get('preview');
      const idParam = params.get('id');
      
      if (previewParam === 'true' && idParam) {
        setIsPreview(true);
        setPreviewId(idParam);
        fetchSingleConsultation(idParam);
      } else {
        fetchConsultations();
      }
    }
  }, [page]);

  // 단일 상담 내역 조회 (미리보기용)
  const fetchSingleConsultation = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/consultations/${id}`);
      const result = await response.json();
      
      if (response.ok && result.data) {
        setSelectedConsultation(result.data);
      } else {
        setError('상담 내역을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('상담 내역 조회 오류:', err);
      setError('상담 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사용자의 상담 내역 조회
  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 미리보기 모드인 경우 API 호출 스킵
      if (isPreview && previewId) {
        return;
      }
      
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('사용자 정보 가져오기 오류:', userError);
        setError('사용자 정보를 가져오는 중 오류가 발생했습니다.');
        return;
      }
      
      if (!user) {
        console.error('사용자 정보 없음');
        setError('로그인이 필요합니다.');
        return;
      }

      console.log('현재 로그인한 사용자 정보:', { 
        id: user.id, 
        email: user.email,
        provider: user.app_metadata?.provider,
        created_at: user.created_at
      });
      
      // 사용자 ID 유효성 확인 - Supabase에서 직접 확인
      try {
        const { data: userData, error: userCheckError } = await supabase
          .from('users')
          .select('id, name, email, phone, account_number')
          .eq('id', user.id)
          .single();
        
        if (userCheckError) {
          // 에러가 발생해도 API 호출은 계속 진행
          console.log('사용자 정보 직접 조회 시 문제가 발생했으나, 상담 내역 조회를 계속합니다:', 
            userCheckError.message || '사용자 정보 조회 에러');
        } else {
          console.log('사용자 정보 직접 조회 결과:', userData);
        }
      } catch (checkErr) {
        // 예외가 발생해도 API 호출은 계속 진행
        console.log('사용자 정보 직접 조회 중 예외가 발생했으나, 상담 내역 조회를 계속합니다:', 
          checkErr instanceof Error ? checkErr.message : '알 수 없는 예외');
      }
      
      // 사용자의 상담 내역 조회
      console.log(`상담 내역 API 호출 시작: /api/consultations/user/${user.id}?page=${page}&limit=${limit}`);
      
      // 더 자세한 오류 정보를 위해 fetch 옵션 추가
      const fetchOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Debug-Info': '1' // 디버그 정보 요청
        }
      };
      
      const response = await fetch(`/api/consultations/user/${user.id}?page=${page}&limit=${limit}`, fetchOptions);
      
      // 응답 상태 로깅
      console.log('상담 내역 API 응답 상태:', response.status, response.statusText);
      console.log('응답 헤더:', Object.fromEntries([...response.headers.entries()]));
      
      const result = await response.json();
      console.log('상담 내역 API 응답 데이터:', result);
      
      // 추가 디버깅: 상담 내역의 user_id 출력
      if (result.data && Array.isArray(result.data)) {
        console.log('상담 내역 조회 성공:', result.data.length, '개 항목');
        console.log('상담 내역 user_id 목록:', result.data.map((item: Consultation) => ({
          id: item.id,
          user_id: item.user_id,
          title: item.title.substring(0, 20),
          reference_url: item.reference_url ? '있음' : '없음'
        })));
      } else {
        console.warn('상담 내역 데이터가 배열이 아니거나 없음:', result);
      }
      
      if (response.ok) {
        if (result.data && Array.isArray(result.data)) {
          console.log(`${result.data.length}개의 상담 내역 로드됨`);
          result.data.forEach((item: Consultation, index: number) => {
            console.log(`상담 내역 #${index + 1}:`, {
              id: item.id,
              title: item.title,
              date: item.consultation_date,
              user_id: item.user_id,
              reference_url: item.reference_url || '없음'
            });
          });
          setConsultations(result.data);
          setTotalPages(result.pagination.totalPages);
          
          // 메시지가 있으면 표시
          if (result.message && result.data.length === 0) {
            setError(result.message);
          }
        } else {
          console.error('API 응답이 올바른 형식이 아닙니다:', result);
          setError(result.message || '상담 내역 데이터 형식이 올바르지 않습니다.');
        }
      } else {
        console.error('API 오류 응답:', result);
        
        // 오류 메시지 개선
        const errorMessage = result.error || result.message || '상담 내역을 불러오는 중 오류가 발생했습니다.';
        const errorDetails = result.details ? ` (${result.details})` : '';
        
        setError(`${errorMessage}${errorDetails}`);
      }
    } catch (err) {
      console.error('상담 내역 조회 오류:', err);
      setError('상담 내역을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 상담 내역 선택 핸들러
  const handleSelectConsultation = async (consultation: Consultation) => {
    try {
      // 상담 내역 상세 조회 (첨부 파일 포함)
      const response = await fetch(`/api/consultations/${consultation.id}`);
      const result = await response.json();
      
      if (response.ok && result.data) {
        setSelectedConsultation(result.data);
      } else {
        throw new Error('상담 내역을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('상담 내역 상세 조회 오류:', err);
      setError('상담 내역을 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 상담 내역 상세 모달 닫기
  const handleCloseDetail = () => {
    setSelectedConsultation(null);
  };

  // 미리보기 모드인 경우 선택된 상담 내역만 표시
  if (isPreview && selectedConsultation) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="bg-white rounded-lg max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-black">{selectedConsultation.title}</h2>
          </div>
          
          <div className="mb-6 flex items-center text-black">
            <Calendar className="h-5 w-5 mr-2" />
            <span>상담 날짜: {formatDate(selectedConsultation.consultation_date)}</span>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-black">상담 내용</h3>
            <div 
              className="prose max-w-none bg-gray-50 p-6 rounded-lg border border-gray-200"
              dangerouslySetInnerHTML={{ __html: selectedConsultation.content }}
            />
          </div>
          
          {selectedConsultation.consultation_attachments && selectedConsultation.consultation_attachments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-black">첨부 파일</h3>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <FileViewer 
                  files={selectedConsultation.consultation_attachments.map(attachment => ({
                    id: attachment.id,
                    fileName: attachment.file_name,
                    fileUrl: attachment.file_url,
                    fileType: attachment.file_type
                  }))}
                />
              </div>
            </div>
          )}
          
          {selectedConsultation.reference_url && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-black">관련 자료</h3>
              <a 
                href={selectedConsultation.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FileText className="h-4 w-4 mr-2" />
                관련 자료 보기
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span>대시보드로 돌아가기</span>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-black mb-6">상담 내역</h1>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg animate-fadeIn">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-black">상담 내역을 불러오는 중...</p>
            </div>
          </div>
        ) : consultations.length === 0 ? (
          <Card className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="absolute h-1 w-full bg-blue-500 top-0 left-0"></div>
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-blue-400 mb-4" />
                <p className="text-lg font-medium text-black">상담 내역이 없습니다.</p>
                <p className="text-black mt-2">관리자에게 문의하시면 상담 내역을 확인하실 수 있습니다.</p>
                <div className="mt-4">
                  <Link href="/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    대시보드로 돌아가기
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {consultations.map((consultation) => (
              <Card 
                key={consultation.id} 
                className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => handleSelectConsultation(consultation)}
              >
                <div className="absolute h-1 w-full bg-blue-500 top-0 left-0"></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-black">{consultation.title}</CardTitle>
                    <div className="flex items-center text-sm text-black">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(consultation.consultation_date)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-black line-clamp-2">
                    {typeof consultation.content === 'string' 
                      ? consultation.content.replace(/<[^>]*>/g, '').substring(0, 150) + (consultation.content.length > 150 ? '...' : '')
                      : '내용이 없습니다.'}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <div className="text-sm text-black">
                    {formatDate(consultation.created_at)}
                  </div>
                  <div className="flex items-center space-x-3">
                    {consultation.consultation_attachments && consultation.consultation_attachments.length > 0 && (
                      <div className="flex items-center text-blue-600">
                        <FileText className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">첨부파일 {consultation.consultation_attachments.length}개</span>
                      </div>
                    )}
                    {consultation.reference_url && (
                      <a 
                        href={consultation.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        <span className="text-sm font-medium">링크</span>
                      </a>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1 || loading}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  page === 1 || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전
              </button>
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-md text-black font-medium">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages || loading}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  page === totalPages || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 상담 내역 상세 모달 */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="absolute h-1 w-full bg-blue-500 top-0 left-0"></div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">{selectedConsultation.title}</h2>
                <button 
                  onClick={handleCloseDetail}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5 text-black" />
                </button>
              </div>
              
              <div className="mb-6 flex items-center text-black">
                <Calendar className="h-5 w-5 mr-2" />
                <span>상담 날짜: {formatDate(selectedConsultation.consultation_date)}</span>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-black">상담 내용</h3>
                <div 
                  className="prose max-w-none bg-gray-50 p-6 rounded-lg border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: selectedConsultation.content }}
                />
              </div>
              
              {selectedConsultation.consultation_attachments && selectedConsultation.consultation_attachments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-black">첨부 파일</h3>
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <FileViewer 
                      files={selectedConsultation.consultation_attachments.map(attachment => ({
                        id: attachment.id,
                        fileName: attachment.file_name,
                        fileUrl: attachment.file_url,
                        fileType: attachment.file_type
                      }))}
                    />
                  </div>
                </div>
              )}
              
              {selectedConsultation.reference_url && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-black">관련 자료</h3>
                  <a 
                    href={selectedConsultation.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    관련 자료 보기
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 