'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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

export default function DashboardAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 가져오기 오류:', error);
          return;
        }
        
        if (session?.user) {
          console.log('로그인된 사용자 ID:', session.user.id);
          setUserId(session.user.id);
        } else {
          console.log('로그인된 사용자 없음');
          setError('로그인이 필요합니다.');
        }
      } catch (err) {
        console.error('사용자 정보 가져오기 오류:', err);
      }
    };
    
    fetchUserInfo();
  }, []);

  // 공지사항 가져오기
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!userId) {
        console.log('사용자 ID가 없어 공지사항을 가져올 수 없습니다.');
        return; // 사용자 ID가 없으면 API 호출하지 않음
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('대시보드에서 공지사항 가져오기 시작 - 사용자 ID:', userId);
        
        // 사용자 ID를 쿼리 파라미터로 전달하여 API 호출
        const response = await fetch(`/api/announcements/user?userId=${userId}`);
        
        if (!response.ok) {
          console.error('공지사항 API 응답 오류:', response.status);
          const errorData = await response.json();
          console.error('API 오류 상세:', errorData);
          throw new Error(errorData.error || '공지사항을 불러오는데 실패했습니다.');
        }
        
        const result = await response.json();
        console.log('API 응답 결과:', result);
        
        if (result.data && result.data.length > 0) {
          console.log('공지사항 데이터 로드 성공:', result.data.length);
          setAnnouncements(result.data);
        } else {
          console.log('공지사항 데이터가 없습니다.');
          setAnnouncements([]);
        }
      } catch (err) {
        console.error('공지사항 가져오기 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncements();
  }, [userId]); // userId가 변경될 때마다 실행

  // 공지사항 내용 요약 (100자 제한)
  const summarizeContent = (content: string) => {
    if (!content) return '';
    // HTML 태그 제거
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= 100) return plainText;
    return plainText.substring(0, 100) + '...';
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

  // 중요도에 따른 스타일 클래스
  const importanceClass = (level: number) => {
    switch (level) {
      case 1: return 'border-l-4 border-red-500 pl-3';
      case 2: return 'border-l-4 border-blue-500 pl-3';
      default: return 'border-l-4 border-gray-300 pl-3';
    }
  };

  return (
    <Card className="col-span-3 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-white">
        <CardTitle className="text-sm font-medium text-blue-800">공지사항</CardTitle>
        <Link href="/announcements" className="text-xs text-blue-600 hover:underline">
          모두 보기
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        {!userId ? (
          // 사용자 ID가 없는 경우
          <div className="flex justify-center items-center h-20">
            <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <span className="ml-2 text-sm text-gray-700">사용자 정보를 불러오는 중...</span>
          </div>
        ) : loading ? (
          // 로딩 상태 표시
          <div className="flex justify-center items-center h-20">
            <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <span className="ml-2 text-sm text-gray-700">로딩 중...</span>
          </div>
        ) : error ? (
          // 오류 메시지 표시
          <div className="text-sm text-red-500 font-medium">{error}</div>
        ) : announcements.length === 0 ? (
          // 공지사항이 없는 경우
          <div className="text-sm text-gray-700 font-medium py-4 text-center">현재 공지사항이 없습니다.</div>
        ) : (
          // 공지사항 목록 표시
          <div className="space-y-4">
            {announcements.slice(0, 3).map((announcement) => (
              <div 
                key={announcement.id} 
                className={`border-b pb-3 last:border-0 last:pb-0 hover:bg-gray-50 transition-colors ${importanceClass(announcement.importance_level)}`}
              >
                <Link href={`/announcements/${announcement.id}`}>
                  <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline">{announcement.title}</h3>
                </Link>
                <p className="mt-1 text-xs text-gray-700">
                  {summarizeContent(announcement.content)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(announcement.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 