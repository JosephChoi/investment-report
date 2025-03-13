import { useState, useEffect } from 'react';
import { Announcement, AnnouncementAttachment } from '@/lib/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AnnouncementDetailProps {
  announcementId: string;
  onClose: () => void;
}

export default function AnnouncementDetail({
  announcementId,
  onClose
}: AnnouncementDetailProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 중요도 레이블
  const importanceLabel = (level: number) => {
    switch (level) {
      case 1:
        return '매우 중요';
      case 2:
        return '중요';
      case 3:
      default:
        return '보통';
    }
  };

  // 중요도에 따른 텍스트 색상 클래스
  const importanceTextClass = (level: number) => {
    switch (level) {
      case 1: // 매우 중요
        return 'text-red-600';
      case 2: // 중요
        return 'text-blue-600';
      case 3: // 보통
      default:
        return 'text-gray-600';
    }
  };

  // 공지사항 상세 정보 조회
  useEffect(() => {
    const fetchAnnouncementDetail = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/announcements/${announcementId}`);
        
        if (!response.ok) {
          throw new Error('공지사항을 불러오는데 실패했습니다.');
        }
        
        const { data } = await response.json();
        setAnnouncement(data);
        
        // 첨부 파일이 있는 경우
        if (data.announcement_attachments && data.announcement_attachments.length > 0) {
          setAttachments(data.announcement_attachments);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (announcementId) {
      fetchAnnouncementDetail();
    }
  }, [announcementId]);

  // 첨부 파일 다운로드
  const handleDownload = (attachment: AnnouncementAttachment) => {
    window.open(attachment.file_url, '_blank');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <div className="flex justify-center p-4">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <div className="text-red-500 p-4">{error}</div>
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <div className="text-gray-500 p-4">공지사항을 찾을 수 없습니다.</div>
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{announcement.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center mb-4 text-sm text-gray-500">
          <span className={`px-2 py-0.5 rounded-full text-xs ${importanceTextClass(announcement.importance_level)} bg-opacity-10`}>
            {importanceLabel(announcement.importance_level)}
          </span>
          <span className="mx-2">•</span>
          <span>
            {format(new Date(announcement.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
          </span>
          <span className="mx-2">•</span>
          <span>
            {announcement.target_type === 'all' 
              ? '전체 공지' 
              : '특정 포트폴리오 공지'}
          </span>
        </div>
        
        <div className="border-t border-b py-4 my-4">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />
        </div>
        
        {attachments.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">첨부 파일</h3>
            <ul className="space-y-2">
              {attachments.map((attachment) => (
                <li key={attachment.id} className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="text-blue-500 hover:text-blue-700 hover:underline"
                  >
                    {attachment.file_name} ({Math.round(attachment.file_size / 1024)} KB)
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
} 