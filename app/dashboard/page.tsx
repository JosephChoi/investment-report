'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, RefreshCw, MessageSquare, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // 로그인하지 않은 경우 로그인 페이지로 이동
          router.push('/login');
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error('인증 확인 오류:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">투자 관리 대시보드</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          로그아웃
        </button>
      </div>
      
      <p className="text-gray-600 mb-8">안녕하세요, {user?.email}님! 투자 현황을 확인하세요.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/monthly-report" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">월간리포트</h2>
          </div>
          <p className="text-gray-600">월별 투자 현황 및 포트폴리오 리포트를 확인하세요.</p>
        </Link>
        
        <Link href="#" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">연체정보</h2>
          </div>
          <p className="text-gray-600">연체 내역 및 상환 일정을 확인하세요.</p>
        </Link>
        
        <Link href="#" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <RefreshCw className="w-8 h-8 text-green-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">리밸런싱 히스토리</h2>
          </div>
          <p className="text-gray-600">포트폴리오 리밸런싱 내역을 확인하세요.</p>
        </Link>
        
        <Link href="#" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-8 h-8 text-purple-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">관리자 상담</h2>
          </div>
          <p className="text-gray-600">관리자와의 상담 내역을 확인하세요.</p>
        </Link>
      </div>
      
      <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-4">
          <Bell className="w-6 h-6 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">최근 알림</h2>
        </div>
        <ul className="space-y-3">
          <li className="p-3 bg-blue-50 rounded-md text-blue-800">
            <span className="font-medium">3월 포트폴리오 리포트</span>가 업데이트되었습니다.
          </li>
          <li className="p-3 bg-gray-50 rounded-md text-gray-800">
            다음 리밸런싱 일정은 <span className="font-medium">2023년 4월 15일</span>입니다.
          </li>
        </ul>
      </div>
    </div>
  );
} 