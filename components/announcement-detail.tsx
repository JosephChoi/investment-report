import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Announcement } from '@/lib/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertTriangle, FileText, Download } from 'lucide-react';

// 파일 크기 포맷팅 함수
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Announcement 타입 확장
interface AnnouncementWithDetails extends Announcement {
  portfolio_details?: Array<{ id: string; name: string; description?: string }>;
  announcement_attachments?: Array<{
    id: string;
    file_name: string;
    file_size: number;
    file_url: string;
    file_type: string;
  }>;
}

interface AnnouncementDetailProps {
  announcementId: string;
  onClose: () => void;
}

export default function AnnouncementDetail({ announcementId, onClose }: AnnouncementDetailProps) {
  const [announcement, setAnnouncement] = useState<AnnouncementWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);

  // 공지사항 상세 정보 가져오기
  useEffect(() => {
    const fetchAnnouncementDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 현재 세션 가져오기
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
        }
        
        // 공지사항 상세 정보 API 호출
        const response = await fetch(`/api/announcements/${announcementId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '공지사항을 불러오는데 실패했습니다.');
        }
        
        const { data } = await response.json();
        
        setAnnouncement(data);
        
        // 첨부 파일 정보 설정
        if (data.announcement_attachments && data.announcement_attachments.length > 0) {
          setAttachments(data.announcement_attachments);
        }
      } catch (err) {
        console.error('공지사항 상세 정보 가져오기 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncementDetail();
  }, [announcementId]);

  // 첨부 파일 다운로드 핸들러
  const handleDownload = async (attachment: any) => {
    try {
      window.open(attachment.file_url, '_blank');
    } catch (err) {
      console.error('파일 다운로드 오류:', err);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 중요도에 따른 스타일 클래스
  const importanceTextClass = (level: number) => {
    switch (level) {
      case 1: return 'text-red-600';
      case 2: return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // 중요도 레이블
  const importanceLabel = (level: number) => {
    switch (level) {
      case 1: return '매우 중요';
      case 2: return '중요';
      default: return '보통';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
            <span className="ml-3 text-lg text-gray-600">로딩 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors duration-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="p-6 text-center">
            <p className="text-gray-500">공지사항을 찾을 수 없습니다.</p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors duration-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{announcement.title}</h2>
            <div className="flex items-center">
              {announcement.importance_level === 1 ? (
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                  매우 중요
                </span>
              ) : announcement.importance_level === 2 ? (
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  중요
                </span>
              ) : (
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                  보통
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <span className="mr-2">
              {new Date(announcement.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="mx-2">•</span>
            <span>
              {announcement.target_type === 'all' 
                ? '전체 공지' 
                : '특정 포트폴리오 공지'}
            </span>
          </div>
          
          {announcement.target_type === 'portfolio' && announcement.portfolio_details && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">대상 포트폴리오</h3>
              <div className="flex flex-wrap gap-2">
                {announcement.portfolio_details.map((portfolio: any) => (
                  <span 
                    key={portfolio.id}
                    className="px-3 py-1 bg-white text-blue-700 text-sm rounded-full border border-blue-200 shadow-sm"
                  >
                    {portfolio.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
          </div>
          
          {announcement.announcement_attachments && announcement.announcement_attachments.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">첨부 파일</h3>
              <ul className="space-y-2">
                {announcement.announcement_attachments.map((attachment: any) => (
                  <li key={attachment.id}>
                    <a 
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                    >
                      <FileText className="h-5 w-5 text-blue-500 mr-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                      </div>
                      <Download className="h-5 w-5 text-gray-400" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors duration-300 shadow-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
} 