'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, RefreshCw, MessageSquare, Bell, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent
} from '@/components/ui/card';

export default function AdminDashboard() {
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
        
        // 관리자 이메일 확인
        if (user.email !== 'kunmin.choi@gmail.com') {
          // 관리자가 아닌 경우 대시보드로 이동
          alert('관리자 권한이 없습니다.');
          router.push('/dashboard');
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-800">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">관리자 대시보드</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="bg-blue-100 p-1.5 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-800">
                {user?.user_metadata?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 rounded-full hover:bg-red-50 transition-colors duration-300 group"
                aria-label="로그아웃"
              >
                <LogOut className="h-4 w-4 text-gray-500 group-hover:text-red-500 transition-colors duration-300" />
              </button>
            </div>
          </div>
        </div>
        
        {/* 관리 메뉴 카드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 월간 리포트 관리 카드 */}
          <Link href="/admin/monthly-report" className="block group">
            <Card className="h-full border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute h-1 w-full bg-blue-500 top-0 left-0 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full mr-4 group-hover:bg-blue-200 transition-colors duration-300">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">월간 리포트 관리</CardTitle>
                </div>
                <p className="text-gray-600 mb-4">월간 리포트를 등록하고 관리합니다.</p>
              </CardContent>
            </Card>
          </Link>
          
          {/* 연체 정보 관리 카드 */}
          <Link href="/admin/overdue-payments" className="block group">
            <Card className="h-full border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute h-1 w-full bg-red-500 top-0 left-0 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 p-3 rounded-full mr-4 group-hover:bg-red-200 transition-colors duration-300">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">연체 정보 관리</CardTitle>
                </div>
                <p className="text-gray-600 mb-4">고객의 연체 정보를 등록하고 관리합니다.</p>
              </CardContent>
            </Card>
          </Link>
          
          {/* 리밸런싱 히스토리 관리 카드 */}
          <Link href="/admin/rebalancing-history" className="block group">
            <Card className="h-full border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute h-1 w-full bg-green-500 top-0 left-0 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full mr-4 group-hover:bg-green-200 transition-colors duration-300">
                    <RefreshCw className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">리밸런싱 히스토리 관리</CardTitle>
                </div>
                <p className="text-gray-600 mb-4">포트폴리오 리밸런싱 내역을 등록하고 관리합니다.</p>
              </CardContent>
            </Card>
          </Link>
          
          {/* 관리자 상담 내역 관리 카드 */}
          <Link href="/admin/consultation" className="block group">
            <Card className="h-full border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute h-1 w-full bg-purple-500 top-0 left-0 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-full mr-4 group-hover:bg-purple-200 transition-colors duration-300">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">관리자 상담 내역 관리</CardTitle>
                </div>
                <p className="text-gray-600 mb-4">고객과의 상담 내역을 등록하고 관리합니다.</p>
              </CardContent>
            </Card>
          </Link>
          
          {/* 공지사항 관리 카드 */}
          <Link href="/admin/announcements" className="block group">
            <Card className="h-full border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute h-1 w-full bg-amber-500 top-0 left-0 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-amber-100 p-3 rounded-full mr-4 group-hover:bg-amber-200 transition-colors duration-300">
                    <Bell className="h-6 w-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">공지사항 관리</CardTitle>
                </div>
                <p className="text-gray-600 mb-4">공지사항을 등록하고 관리합니다.</p>
              </CardContent>
            </Card>
          </Link>
          
          {/* 사용자 역할 관리 카드 */}
          <Link href="/admin/user-role" className="block group">
            <Card className="h-full border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute h-1 w-full bg-indigo-500 top-0 left-0 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4 group-hover:bg-indigo-200 transition-colors duration-300">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">사용자 역할 관리</CardTitle>
                </div>
                <p className="text-gray-600 mb-4">사용자의 역할(관리자/일반 사용자)을 관리합니다.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
            대시보드로 이동
          </Link>
        </div>
      </div>
    </div>
  );
} 