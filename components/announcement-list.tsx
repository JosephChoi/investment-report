import { useState, useEffect } from 'react';
import { Announcement } from '@/lib/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
    } else {
      // onViewDetail 핸들러가 없는 경우 직접 라우팅
      router.push(`/announcements/${announcement.id}`);
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
    return (
      <div className="flex justify-center p-4">
        <div className="w-8 h-8 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>공지사항이 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                중요도
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제목
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                대상
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작성일
              </th>
              {isAdmin && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {announcements.map((announcement) => (
              <tr 
                key={announcement.id} 
                className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                onClick={() => handleViewDetail(announcement)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {announcement.importance_level === 1 ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        매우 중요
                      </span>
                    ) : announcement.importance_level === 2 ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        중요
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        보통
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 line-clamp-1">{announcement.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {announcement.target_type === 'all' ? (
                      <span>전체 공지</span>
                    ) : (
                      <span>특정 포트폴리오</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(announcement.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(announcement);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      수정
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(announcement);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 페이지네이션 */}
      {totalCount > limit && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">이전</span>
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {Array.from({ length: Math.ceil(totalCount / limit) }).map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  page === i + 1
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === Math.ceil(totalCount / limit)}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                page === Math.ceil(totalCount / limit)
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">다음</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
} 