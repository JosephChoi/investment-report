'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ChevronLeft, Bell, AlertTriangle, FileText, Calendar, ChevronRight } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  target_type: string;
  target_portfolios: string[];
  importance_level: 1 | 2 | 3; // 1: 매우 중요, 2: 중요, 3: 보통
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 현재 세션 가져오기
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
        }
        
        // 사용자 ID 가져오기
        const userId = session.user.id;
        
        // 사용자별 공지사항 API 호출
        const response = await fetch(`/api/announcements/user?userId=${userId}&page=${page}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '공지사항을 불러오는데 실패했습니다.');
        }
        
        const result = await response.json();
        console.log('공지사항 목록 데이터:', result);
        
        if (result.data) {
          setAnnouncements(result.data);
          // 페이지네이션 정보가 있는 경우
          if (result.pagination) {
            setTotalPages(result.pagination.totalPages || 1);
          }
        } else {
          throw new Error('공지사항 데이터가 없습니다.');
        }
      } catch (err) {
        console.error('공지사항 가져오기 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncements();
  }, [page]);

  // 공지사항 내용 요약 (200자 제한)
  const summarizeContent = (content: string) => {
    if (!content) return '';
    // HTML 태그 제거
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= 200) return plainText;
    return plainText.substring(0, 200) + '...';
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 중요도에 따른 스타일 및 라벨
  const getImportanceInfo = (level: number) => {
    switch (level) {
      case 1:
        return {
          color: 'bg-red-500',
          label: '매우 중요',
          textColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 2:
        return {
          color: 'bg-blue-500',
          label: '중요',
          textColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          color: 'bg-gray-400',
          label: '일반',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span>대시보드로 돌아가기</span>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">공지사항</h1>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg animate-fadeIn">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              <p>{error}</p>
            </div>
          </div>
        )}
      
        {loading ? (
          // 로딩 상태 표시
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-gray-800">공지사항을 불러오는 중...</p>
            </div>
          </div>
        ) : announcements.length === 0 ? (
          // 공지사항이 없는 경우
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute h-1 w-full bg-blue-500 top-0 left-0"></div>
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700">현재 공지사항이 없습니다.</p>
                <p className="text-gray-500 mt-2">새로운 공지사항이 등록되면 이곳에 표시됩니다.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          // 공지사항 목록 표시
          <div className="space-y-6">
            {announcements.map((announcement) => {
              const importanceInfo = getImportanceInfo(announcement.importance_level);
              
              return (
                <Card 
                  key={announcement.id} 
                  className={`border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
                >
                  <div className={`absolute h-1 w-full ${importanceInfo.color} top-0 left-0`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Link href={`/announcements/${announcement.id}`}>
                        <CardTitle className="text-xl text-gray-900 hover:text-blue-600 hover:underline transition-colors">
                          {announcement.title}
                        </CardTitle>
                      </Link>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${importanceInfo.textColor} ${importanceInfo.bgColor} border ${importanceInfo.borderColor}`}>
                        {importanceInfo.label}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-700">
                      {summarizeContent(announcement.content)}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-gray-100 pt-4 flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(announcement.created_at)}
                    </div>
                    <Link 
                      href={`/announcements/${announcement.id}`}
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      자세히 보기
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
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
                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전
              </button>
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-700 font-medium">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages || loading}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  page === totalPages || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
                }`}
              >
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 