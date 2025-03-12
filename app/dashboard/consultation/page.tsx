'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
// 파일 뷰어 컴포넌트 임포트
import FileViewer from '@/components/file-viewer';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

// 상담 내역 타입 정의
interface Consultation {
  id: string;
  user_id: string;
  title: string;
  content: string;
  consultation_date: string;
  created_at: string;
  updated_at?: string;
  attachments?: {
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
  
  // 페이지네이션 상태
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);

  // 상담 내역 로드
  useEffect(() => {
    fetchConsultations();
  }, [page]);

  // 사용자의 상담 내역 조회
  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('로그인이 필요합니다.');
        return;
      }
      
      // 사용자의 상담 내역 조회
      const response = await fetch(`/api/consultations/user/${user.id}?page=${page}&limit=${limit}`);
      const result = await response.json();
      
      if (response.ok) {
        setConsultations(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        setError(result.error || '상담 내역을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('상담 내역 조회 오류:', err);
      setError('상담 내역을 불러오는 중 오류가 발생했습니다.');
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-4">
          <ArrowLeft className="h-5 w-5 text-black" />
        </Link>
        <h1 className="text-2xl font-bold">상담 내역</h1>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 text-black">상담 내역 목록</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : consultations.length === 0 ? (
          <p className="text-black font-medium py-4 text-center">상담 내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black border-collapse">
              <thead className="bg-white border-b-2 border-black">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">날짜</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">제목</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">첨부파일</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black">
                {consultations.map((consultation) => (
                  <tr 
                    key={consultation.id} 
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => handleSelectConsultation(consultation)}
                  >
                    <td className="px-6 py-5 whitespace-nowrap text-base text-black">
                      {formatDate(consultation.consultation_date)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base font-medium text-black">
                      {consultation.title}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-black">
                      {consultation.attachments && consultation.attachments.length > 0 ? (
                        <span className="text-blue-600 font-medium">{consultation.attachments.length}개</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1 || loading}
                className={`px-4 py-2 rounded-md ${
                  page === 1 || loading
                    ? 'bg-white border border-black text-black opacity-50 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                이전
              </button>
              <div className="px-4 py-2 text-black font-medium">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages || loading}
                className={`px-4 py-2 rounded-md ${
                  page === totalPages || loading
                    ? 'bg-white border border-black text-black opacity-50 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 상담 내역 상세 모달 */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedConsultation.title}</h2>
              <button 
                onClick={handleCloseDetail}
                className="text-black hover:text-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-base text-black font-medium">상담 날짜: {formatDate(selectedConsultation.consultation_date)}</p>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">상담 내용</h3>
              <div 
                className="text-black bg-white p-6 rounded-md border border-black"
                dangerouslySetInnerHTML={{ __html: selectedConsultation.content }}
              />
            </div>
            
            {selectedConsultation.attachments && selectedConsultation.attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">첨부 파일</h3>
                {/* 파일 뷰어 컴포넌트로 대체 */}
                <FileViewer 
                  files={selectedConsultation.attachments.map(attachment => ({
                    id: attachment.id,
                    fileName: attachment.file_name,
                    fileUrl: attachment.file_url,
                    fileType: attachment.file_type
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 