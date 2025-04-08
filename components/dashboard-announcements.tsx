'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Announcement } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

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
  }, []);

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

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-amber-100 p-1.5 rounded-full mr-2">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">공지사항</CardTitle>
            </div>
            <Link 
              href="/announcements" 
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <span>전체 보기</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200 overflow-hidden">
      <CardHeader className="bg-blue-50 border-b border-blue-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-full">
              <Bell className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-blue-900">공지사항</CardTitle>
          </div>
          <Link 
            href="/announcements" 
            className="text-sm text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors"
            passHref
          >
            <span>전체보기</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {announcements.length > 0 ? (
          <div className="space-y-2">
            {announcements.slice(0, 5).map((announcement) => {
              const style = getImportanceStyle(announcement.importance_level);
              return (
                <div 
                  key={announcement.id} 
                  className={`transition-all duration-200 cursor-pointer ${style.bg} border-b last:border-b-0 border-gray-100 -mx-6 px-6 py-2.5 first:pt-0`}
                  onClick={() => {
                    // 현재 페이지가 대시보드임을 로컬 스토리지에 저장하고 공지사항으로 이동
                    localStorage.setItem('redirectFrom', '/dashboard');
                    router.push(`/announcements/${announcement.id}`);
                  }}
                >
                  <div className={`border-l-4 ${style.border} pl-3`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1 flex-1 pr-4">
                        {announcement.title}
                      </p>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(announcement.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">공지사항이 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 