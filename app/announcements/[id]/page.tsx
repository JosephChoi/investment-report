'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, FileText, Download, ArrowLeft, Home, Clock, Users, Target, ExternalLink } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import Link from 'next/link';
import React from 'react';

// 공지사항 타입 정의
interface Announcement {
  id: string;
  title: string;
  content: string;
  importance_level: 1 | 2 | 3; // 1: 매우 중요, 2: 중요, 3: 보통
  created_at: string;
  target_type: 'all' | 'portfolio';
  target_portfolios?: string[];
  link_url?: string;
}

// 확장된 공지사항 타입
interface AnnouncementWithDetails extends Announcement {
  portfolio_details?: Array<{ id: string; name: string; description?: string }>;
  announcement_attachments?: Array<{
    id: string;
    file_name: string;
    file_size: number;
    file_url: string;
    file_type: string;
  }>;
  reference_url?: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AnnouncementDetailPage({ params }: PageProps) {
  // Next.js 15에서는 params가 Promise이므로 React.use()를 사용하여 접근해야 합니다.
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  
  const [announcement, setAnnouncement] = useState<AnnouncementWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 공지사항 상세 정보 가져오기
  useEffect(() => {
    const fetchAnnouncementDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 공지사항 상세 정보 API 호출 (인증 헤더 없이)
        const response = await fetch(`/api/announcements/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '공지사항을 불러오는데 실패했습니다.');
        }
        
        const result = await response.json();
        console.log('공지사항 상세 정보:', result);
        
        if (result.data) {
          setAnnouncement(result.data);
        } else {
          throw new Error('공지사항 데이터가 없습니다.');
        }
      } catch (err) {
        console.error('공지사항 상세 정보 가져오기 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncementDetail();
  }, [id]);

  // 중요도에 따른 스타일 클래스
  const getImportanceStyle = (level: number) => {
    switch (level) {
      case 1: return {
        color: 'red',
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200'
      };
      case 2: return {
        color: 'amber',
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-200'
      };
      default: return {
        color: 'gray',
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200'
      };
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
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6">
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-lg text-gray-600">로딩 중...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
          <div className="bg-red-50/90 backdrop-blur-sm text-red-700 p-6 rounded-2xl border-2 border-red-200/50 shadow-xl transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <h2 className="font-bold text-xl">오류 발생</h2>
            </div>
            <p className="text-lg ml-11">{error}</p>
            <div className="mt-6 ml-11">
              <Link 
                href="/announcements" 
                className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:translate-x-1 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                공지사항 목록으로
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
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
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 text-center">
            <p className="text-gray-500 text-lg mb-6">공지사항을 찾을 수 없습니다.</p>
            <Link 
              href="/announcements" 
              className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:translate-x-1 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              공지사항 목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const style = getImportanceStyle(announcement.importance_level);

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
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/announcements" 
            className="group flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:translate-x-1 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 mr-2" />
            <span className="font-medium">공지사항 목록으로</span>
          </Link>
          <Link 
            href="/dashboard" 
            className="group flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:translate-x-1 shadow-lg hover:shadow-xl"
          >
            <span className="font-medium mr-2">대시보드로 이동</span>
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
          </Link>
        </div>

        {/* 공지사항 제목 섹션 */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">공지사항</h1>
              </div>
              <span className={`px-4 py-2 text-sm font-semibold rounded-full ${style.bg} ${style.text} ${style.border} border`}>
                {importanceLabel(announcement.importance_level)}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 leading-tight">{announcement.title}</h2>
          </div>
        </div>

        {/* 공지사항 정보 섹션 */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">공지 정보</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-gray-700">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  {new Date(announcement.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center text-gray-700">
                <Target className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  {announcement.target_type === 'all' 
                    ? '전체 공지' 
                    : '특정 포트폴리오 공지'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 대상 포트폴리오 섹션 */}
        {announcement.target_type === 'portfolio' && announcement.portfolio_details && (
          <div className="mb-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">대상 포트폴리오</h3>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {announcement.portfolio_details.map((portfolio: any) => (
                  <span 
                    key={portfolio.id}
                    className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200 shadow-sm"
                  >
                    {portfolio.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* 공지사항 내용 섹션 */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">공지 내용</h3>
            </div>
            
            <div className="prose max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: announcement.content }} 
                className="text-gray-700 leading-relaxed"
              />
            </div>
          </div>
        </div>
        
                 {/* 관련 링크 섹션 */}
         {(announcement.link_url || announcement.reference_url) && (
           <div className="mb-6">
             <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
               <div className="flex items-center mb-4">
                 <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                   <ExternalLink className="h-4 w-4 text-white" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-800">관련 링크</h3>
               </div>
               
               <div className="ml-11">
                 <a 
                   href={announcement.link_url || announcement.reference_url}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="w-full inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                 >
                   <ExternalLink className="w-5 h-5 mr-2" />
                   공지사항 자세히 보기
                 </a>
               </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
} 