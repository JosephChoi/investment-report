'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  target_type: string;
  target_portfolios: string[];
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        const response = await fetch(`/api/announcements/user?userId=${userId}`, {
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
  }, []);

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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">공지사항</h1>
      
      {loading ? (
        // 로딩 상태 표시
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
          <span className="ml-3 text-lg text-gray-600">로딩 중...</span>
        </div>
      ) : error ? (
        // 오류 메시지 표시
        <Card className="w-full bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : announcements.length === 0 ? (
        // 공지사항이 없는 경우
        <Card className="w-full">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">현재 공지사항이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        // 공지사항 목록 표시
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="w-full hover:shadow-md transition-shadow">
              <CardHeader>
                <Link href={`/announcements/${announcement.id}`}>
                  <CardTitle className="text-lg hover:underline">{announcement.title}</CardTitle>
                </Link>
                <p className="text-sm text-gray-500">{formatDate(announcement.created_at)}</p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{summarizeContent(announcement.content)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 