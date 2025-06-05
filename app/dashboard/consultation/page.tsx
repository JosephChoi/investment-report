'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Calendar, FileText, X, ChevronLeft, ChevronRight, Home, MessageSquare, AlertCircle, ExternalLink } from 'lucide-react';
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
        
        if (response.status === 404) {
          setError('상담 내역을 찾을 수 없습니다.');
        } else if (response.status === 403) {
          setError('접근 권한이 없습니다.');
        } else if (response.status >= 500) {
          setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('상담 내역 조회 네트워크 오류:', err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.');
      } else {
        setError('상담 내역을 불러오는 중 예상치 못한 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 상담 내역 선택 핸들러
  const handleSelectConsultation = async (consultation: Consultation) => {
    try {
      console.log('상담 내역 상세 조회 시작:', consultation.id);
      
      const response = await fetch(`/api/consultations/${consultation.id}`);
      const result = await response.json();
      
      if (response.ok && result.data) {
        console.log('상담 내역 상세 조회 성공:', result.data);
        setSelectedConsultation(result.data);
      } else {
        console.error('상담 내역 상세 조회 오류:', result);
        setError('상담 내역 상세 정보를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('상담 내역 상세 조회 네트워크 오류:', err);
      setError('상담 내역 상세 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleCloseDetail = () => {
    setSelectedConsultation(null);
  };

  // 미리보기 모드인 경우 선택된 상담 내역만 표시
  if (isPreview && selectedConsultation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-6">
          {/* 네비게이션 */}
          <div className="flex justify-start items-center mb-6">
            <Link 
              href="/dashboard" 
              className="group flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:translate-x-1 shadow-lg hover:shadow-xl"
            >
              <span className="font-medium mr-2">대시보드로 이동</span>
              <Home className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            </Link>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedConsultation.title}</h2>
            <div className="flex items-center text-gray-600 mb-6">
              <Calendar className="h-5 w-5 mr-2" />
              <span>상담 날짜: {formatDate(selectedConsultation.consultation_date)}</span>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">상담 내용</h3>
              <div 
                className="prose max-w-none bg-gray-50 p-6 rounded-lg border border-gray-200"
                dangerouslySetInnerHTML={{ __html: selectedConsultation.content }}
              />
            </div>
            
            {selectedConsultation.consultation_attachments && selectedConsultation.consultation_attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">첨부 파일</h3>
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
                <h3 className="text-lg font-semibold mb-3 text-gray-800">관련 자료</h3>
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-6">
        {/* 네비게이션 */}
        <div className="flex justify-start items-center mb-6">
          <Link 
            href="/dashboard" 
            className="group flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:translate-x-1 shadow-lg hover:shadow-xl"
          >
            <span className="font-medium mr-2">대시보드로 이동</span>
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
          </Link>
        </div>

        {/* 제목 섹션 */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">상담 내역</h1>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50/90 backdrop-blur-sm text-red-700 p-6 rounded-2xl border-2 border-red-200/50 shadow-xl transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <h2 className="font-bold text-xl">오류 발생</h2>
              </div>
              <p className="text-lg ml-11">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : consultations.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-8 text-center transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="bg-gray-100 p-4 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">상담 내역이 없습니다</h3>
            <p className="text-gray-600 mb-6">관리자에게 문의하시면 상담 내역을 확인하실 수 있습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div 
                key={consultation.id} 
                className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 cursor-pointer transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                onClick={() => handleSelectConsultation(consultation)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">{consultation.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 flex-shrink-0">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(consultation.consultation_date)}
                  </div>
                </div>
                
                <div className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                  {typeof consultation.content === 'string' 
                    ? consultation.content.replace(/<[^>]*>/g, '').substring(0, 150) + (consultation.content.length > 150 ? '...' : '')
                    : '내용이 없습니다.'}
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
                  <div className="text-sm text-gray-500">
                    {formatDate(consultation.created_at)}
                  </div>
                  <div className="flex items-center space-x-4">
                    {consultation.consultation_attachments && consultation.consultation_attachments.length > 0 && (
                      <div className="flex items-center text-blue-600">
                        <FileText className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">첨부파일 {consultation.consultation_attachments.length}개</span>
                      </div>
                    )}
                    {consultation.reference_url && (
                      <div className="flex items-center text-green-600">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">링크</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                  page === 1 || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white/70 backdrop-blur-sm border border-blue-200/50 text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg'
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전
              </button>
              <div className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-lg text-gray-800 font-medium shadow-md">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages || loading}
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                  page === totalPages || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white/70 backdrop-blur-sm border border-blue-200/50 text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg'
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-gray-200/50">
            <div className="relative">
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">상담 내역 상세</h2>
                  </div>
                  <button 
                    onClick={handleCloseDetail}
                    className="p-2 rounded-full hover:bg-white/20 transition-all duration-300"
                    aria-label="닫기"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* 제목 및 날짜 */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{selectedConsultation.title}</h3>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>상담 날짜: {formatDate(selectedConsultation.consultation_date)}</span>
                  </div>
                </div>
                
                {/* 상담 내용 */}
                <div className="mb-6">
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">상담 내용</h3>
                    </div>
                    <div className="ml-11">
                      <div 
                        className="prose max-w-none bg-gray-50/80 p-6 rounded-xl border border-gray-200/50 text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedConsultation.content }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 첨부 파일 */}
                {selectedConsultation.consultation_attachments && selectedConsultation.consultation_attachments.length > 0 && (
                  <div className="mb-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">첨부 파일</h3>
                      </div>
                      <div className="ml-11">
                        <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-200/50">
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
                    </div>
                  </div>
                )}
                
                {/* 관련 자료 */}
                {selectedConsultation.reference_url && (
                  <div className="mb-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                          <ExternalLink className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">관련 자료</h3>
                      </div>
                      <div className="ml-11">
                        <a 
                          href={selectedConsultation.reference_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <ExternalLink className="w-5 h-5 mr-2" />
                          관련 자료 보기
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 