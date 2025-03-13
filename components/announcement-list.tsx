import { useState, useEffect } from 'react';
import { Announcement } from '@/lib/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AnnouncementListProps {
  isAdmin?: boolean;
  onViewDetail?: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
}

export default function AnnouncementList({
  isAdmin = false,
  onViewDetail,
  onEdit,
  onDelete
}: AnnouncementListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // 중요도에 따른 배경색 클래스
  const importanceBgClass = (level: number) => {
    switch (level) {
      case 1: // 매우 중요
        return 'bg-red-50 border-red-200';
      case 2: // 중요
        return 'bg-blue-50 border-blue-200';
      case 3: // 보통
      default:
        return 'bg-white border-gray-200';
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

  // 공지사항 목록 조회
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = isAdmin 
        ? `/api/announcements?page=${page}&limit=${limit}` 
        : `/api/announcements/user?page=${page}&limit=${limit}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('공지사항을 불러오는데 실패했습니다.');
      }
      
      const { data, count } = await response.json();
      setAnnouncements(data);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 시 공지사항 목록 다시 조회
  useEffect(() => {
    fetchAnnouncements();
  }, [page, isAdmin]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 공지사항 상세 보기
  const handleViewDetail = (announcement: Announcement) => {
    if (onViewDetail) {
      onViewDetail(announcement);
    }
  };

  // 공지사항 수정
  const handleEdit = (announcement: Announcement) => {
    if (onEdit) {
      onEdit(announcement);
    }
  };

  // 공지사항 삭제
  const handleDelete = async (announcement: Announcement) => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      if (onDelete) {
        onDelete(announcement);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (announcements.length === 0) {
    return <div className="text-gray-500 p-4">공지사항이 없습니다.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`p-4 border rounded-lg shadow-sm ${importanceBgClass(announcement.importance_level)}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 
                  className="text-lg font-semibold cursor-pointer hover:underline"
                  onClick={() => handleViewDetail(announcement)}
                >
                  {announcement.title}
                </h3>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${importanceTextClass(announcement.importance_level)} bg-opacity-10`}>
                    {importanceLabel(announcement.importance_level)}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {formatDistanceToNow(new Date(announcement.created_at), { 
                      addSuffix: true,
                      locale: ko
                    })}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {announcement.target_type === 'all' 
                      ? '전체 공지' 
                      : '특정 포트폴리오 공지'}
                  </span>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(announcement)}
                    className="text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* 페이지네이션 */}
      {totalCount > limit && (
        <div className="flex justify-center mt-4">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded ${
                page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-50'
              }`}
            >
              이전
            </button>
            
            {Array.from({ length: Math.ceil(totalCount / limit) }).map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 rounded ${
                  page === i + 1 ? 'bg-blue-500 text-white' : 'text-blue-500 hover:bg-blue-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= Math.ceil(totalCount / limit)}
              className={`px-3 py-1 rounded ${
                page >= Math.ceil(totalCount / limit) ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-50'
              }`}
            >
              다음
            </button>
          </nav>
        </div>
      )}
    </div>
  );
} 