'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Announcement } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Bell, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/announcements/user?userId=${session.user.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('공지사항을 불러오는데 실패했습니다.');
        }

        const { data } = await response.json();
        setAnnouncements(data || []);
      } catch (error) {
        console.error('공지사항 조회 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [router]);

  const getImportanceStyle = (level: number) => {
    switch (level) {
      case 1: // 매우 중요
        return {
          border: 'border-red-500',
          bg: 'hover:bg-red-50'
        };
      case 2: // 중요
        return {
          border: 'border-amber-500',
          bg: 'hover:bg-amber-50'
        };
      default: // 보통
        return {
          border: 'border-gray-300',
          bg: 'hover:bg-gray-50'
        };
    }
  };

  // HTML 태그를 제거하는 함수
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  // 대시보드로 이동
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-6 max-w-4xl">
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-0">
              <div className="absolute h-1 w-full bg-amber-500 top-0 left-0"></div>
              <div className="flex items-center">
                <div className="bg-amber-100 p-1.5 rounded-full mr-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-xl text-gray-900">공지사항</h2>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-center items-center h-16">
                <div className="w-5 h-5 border-t-2 border-b-2 border-amber-600 rounded-full animate-spin"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 max-w-4xl">
        <Card className="border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-0">
            <div className="absolute h-1 w-full bg-amber-500 top-0 left-0"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-amber-100 p-1.5 rounded-full mr-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-xl text-gray-900">공지사항</h2>
              </div>
              <button
                onClick={handleGoToDashboard}
                className="flex items-center px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                대시보드로 돌아가기
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {announcements.length > 0 ? (
                announcements.map((announcement) => {
                  const style = getImportanceStyle(announcement.importance_level);
                  return (
                    <div 
                      key={announcement.id} 
                      className={`rounded-md transition-all duration-200 cursor-pointer ${style.bg}`}
                      onClick={() => router.push(`/announcements/${announcement.id}`)}
                    >
                      <div className={`border-l-4 ${style.border} p-4`}>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-medium text-gray-900">
                              {stripHtmlTags(announcement.title)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(announcement.created_at).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {stripHtmlTags(announcement.content)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">공지사항이 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 