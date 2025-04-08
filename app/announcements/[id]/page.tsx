'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, FileText, Download, ArrowLeft } from 'lucide-react';
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
  const importanceTextClass = (level: number) => {
    switch (level) {
      case 1: return 'text-red-600';
      case 2: return 'text-blue-600';
      default: return 'text-gray-600';
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

  // 뒤로 가기
  const handleGoBack = () => {
    // 로컬 스토리지에서 이전 페이지 정보 확인
    const redirectFrom = typeof window !== 'undefined' ? localStorage.getItem('redirectFrom') : null;
    
    if (redirectFrom) {
      // 로컬 스토리지에서 정보 삭제
      localStorage.removeItem('redirectFrom');
      // 저장된 경로로 이동
      router.push(redirectFrom);
    } else {
      // 일반적인 뒤로 가기
      router.back();
    }
  };

  // 대시보드로 이동
  const handleGoToDashboard = () => {
    // 로컬 스토리지 정보 삭제 (이미 대시보드로 직접 이동하므로)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('redirectFrom');
    }
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
            <span className="ml-3 text-lg text-gray-600">로딩 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleGoBack}
              className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl p-6 text-center">
          <p className="text-gray-500">공지사항을 찾을 수 없습니다.</p>
          <div className="mt-6">
            <button
              onClick={handleGoBack}
              className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center mb-2">
            <button
              onClick={handleGoBack}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-300"
            >
              <ArrowLeft className="h-5 w-5 text-black" />
            </button>
            <h1 className="text-2xl font-bold text-black">공지사항</h1>
            <div className="flex-grow"></div>
            <button
              onClick={handleGoToDashboard}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-300 text-sm font-medium"
            >
              대시보드로 돌아가기
            </button>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">{announcement.title}</h2>
            <div>
              {announcement.importance_level === 1 ? (
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                  매우 중요
                </span>
              ) : announcement.importance_level === 2 ? (
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  중요
                </span>
              ) : (
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                  보통
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* 본문 */}
        <div className="p-6">
          <div className="flex items-center text-sm text-black mb-6">
            <span className="mr-2">
              {new Date(announcement.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="mx-2">•</span>
            <span>
              {announcement.target_type === 'all' 
                ? '전체 공지' 
                : '특정 포트폴리오 공지'}
            </span>
          </div>
          
          {announcement.target_type === 'portfolio' && announcement.portfolio_details && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">대상 포트폴리오</h3>
              <div className="flex flex-wrap gap-2">
                {announcement.portfolio_details.map((portfolio: any) => (
                  <span 
                    key={portfolio.id}
                    className="px-3 py-1 bg-white text-blue-700 text-sm rounded-full border border-blue-200 shadow-sm"
                  >
                    {portfolio.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="prose max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: announcement.content }} 
              className="text-black leading-relaxed"
            />
          </div>
          
          {(announcement.link_url || announcement.reference_url) && (
            <div className="mt-8 border-t pt-6">
              <a 
                href={announcement.link_url || announcement.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FileText className="h-4 w-4 mr-2" />
                자세히 보기
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 