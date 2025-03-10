'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, RefreshCw, MessageSquare, Bell, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
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

  // 가상 계좌 삭제 처리
  const handleDeleteVirtualAccounts = async () => {
    if (!confirm('가상 계좌 정보(123-456-789, 987-654-321)를 삭제하시겠습니까?')) {
      return;
    }
    
    setDeleteLoading(true);
    setDeleteMessage(null);
    
    try {
      const response = await fetch('/api/admin/delete-virtual-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDeleteMessage('가상 계좌 정보가 성공적으로 삭제되었습니다.');
      } else {
        setDeleteMessage(`오류: ${result.error}`);
      }
    } catch (error: any) {
      console.error('가상 계좌 삭제 오류:', error);
      setDeleteMessage(`오류: ${error.message || '가상 계좌 삭제 중 오류가 발생했습니다.'}`);
    } finally {
      setDeleteLoading(false);
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
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          로그아웃
        </button>
      </div>
      
      {deleteMessage && (
        <div className={`mb-6 p-4 rounded-md ${deleteMessage.includes('오류') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {deleteMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 월간리포트 관리 카드 */}
        <Link href="/admin/monthly-report" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">월간리포트 관리</h2>
                <p className="text-gray-600 text-sm mb-4">월별 고객 리스트, 포트폴리오 자료, 월간 코멘트를 관리합니다.</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>월별 전체 고객 리스트 업로드</li>
                  <li>포트폴리오 자료(JPG) 업로드</li>
                  <li>공통 Monthly Comment 작성</li>
                </ul>
              </div>
            </div>
          </div>
        </Link>
        
        {/* 연체정보 관리 카드 */}
        <Link href="/admin/delinquency" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">연체정보 관리</h2>
                <p className="text-gray-600 text-sm mb-4">고객 연체정보를 관리합니다.</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>연체정보 엑셀 업로드</li>
                  <li>연체정보 수정 및 관리</li>
                </ul>
              </div>
            </div>
          </div>
        </Link>
        
        {/* 리밸런싱 히스토리 관리 카드 */}
        <Link href="/admin/rebalancing" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <RefreshCw className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">리밸런싱 히스토리 관리</h2>
                <p className="text-gray-600 text-sm mb-4">포트폴리오 리밸런싱 내역을 관리합니다.</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>월별 리밸런싱 내용 엑셀 업로드</li>
                  <li>리밸런싱 히스토리 관리</li>
                </ul>
              </div>
            </div>
          </div>
        </Link>
        
        {/* 관리자 상담 내역 관리 카드 */}
        <Link href="/admin/consultation" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <MessageSquare className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">관리자 상담 내역 관리</h2>
                <p className="text-gray-600 text-sm mb-4">고객 상담 내역을 관리합니다.</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>상담 내역 등록 및 수정</li>
                  <li>상담 내역 조회</li>
                </ul>
              </div>
            </div>
          </div>
        </Link>
        
        {/* 최근 알림 관리 카드 */}
        <Link href="/admin/notifications" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <Bell className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">최근 알림 관리</h2>
                <p className="text-gray-600 text-sm mb-4">고객에게 표시될 알림을 관리합니다.</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>공지사항 등록 및 수정</li>
                  <li>알림 관리</li>
                </ul>
              </div>
            </div>
          </div>
        </Link>
        
        {/* 가상 계좌 삭제 카드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <Trash2 className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">가상 계좌 삭제</h2>
              <p className="text-gray-600 text-sm mb-4">테스트용 가상 계좌 정보를 삭제합니다.</p>
              <button
                onClick={handleDeleteVirtualAccounts}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
              >
                {deleteLoading ? '삭제 중...' : '가상 계좌 삭제'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
} 