'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Announcement } from '@/lib/types';
import { Bell, Home, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
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
          border: 'border-l-red-500',
          bg: 'hover:bg-red-50/50',
          badge: 'bg-red-100 text-red-800'
        };
      case 2: // 중요
        return {
          border: 'border-l-amber-500',
          bg: 'hover:bg-amber-50/50',
          badge: 'bg-amber-100 text-amber-800'
        };
      default: // 보통
        return {
          border: 'border-l-gray-400',
          bg: 'hover:bg-gray-50/50',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getImportanceLabel = (level: number) => {
    switch (level) {
      case 1: return '매우 중요';
      case 2: return '중요';
      default: return '보통';
    }
  };

  // HTML 태그를 제거하는 함수
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-6">
        {/* 네비게이션 */}
        <div className="flex justify-start items-center mb-6">
          <Link 
            href="/dashboard" 
            className="group flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:translate-x-1 shadow-lg hover:shadow-xl"
          >
            <span className="font-medium mr-2">대시보드로 이동</span>
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
          </Link>
        </div>

        {/* 제목 섹션 */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">공지사항</h1>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50/90 backdrop-blur-sm text-red-700 p-6 rounded-2xl border-2 border-red-200/50 shadow-xl transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <h2 className="font-bold text-xl">오류 발생</h2>
            </div>
            <p className="text-lg ml-11">{error}</p>
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="p-6">
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => {
                    const style = getImportanceStyle(announcement.importance_level);
                    return (
                      <div 
                        key={announcement.id} 
                        className={`bg-white/50 rounded-xl border-l-4 ${style.border} p-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${style.bg}`}
                        onClick={() => router.push(`/announcements/${announcement.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                              {stripHtmlTags(announcement.title)}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                              {stripHtmlTags(announcement.content)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end ml-4">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${style.badge} mb-2`}>
                              {getImportanceLabel(announcement.importance_level)}
                            </span>
                            <p className="text-sm text-gray-500">
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
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">공지사항이 없습니다</h3>
                  <p className="text-gray-600">새로운 공지사항이 등록되면 알려드리겠습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 