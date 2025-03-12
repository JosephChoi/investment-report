'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, RefreshCw, MessageSquare, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<any>(null);
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
        console.log('로그인한 사용자 정보:', user);
        
        // 사용자 계좌 정보 가져오기
        await fetchUserAccounts(user);
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // 사용자 계좌 정보 가져오기 함수
  const fetchUserAccounts = async (user: any) => {
    try {
      console.log('계좌 정보 가져오기 시작...');
      console.log('현재 로그인한 사용자 이메일:', user.email);
      
      // 서비스 역할 키를 사용하는 API를 통해 계좌 정보 가져오기
      const response = await fetch('/api/get-all-accounts');
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('모든 계좌 정보:', result.data);
        
        // 현재 로그인한 사용자의 이메일과 일치하는 계좌만 필터링
        const userAccounts = result.data.filter((account: any) => {
          return account.user && 
                 account.user.email && 
                 account.user.email.toLowerCase() === user.email.toLowerCase();
        });
        
        if (userAccounts.length > 0) {
          console.log('현재 사용자의 실제 계좌 정보:', userAccounts);
          setAccounts(userAccounts);
          
          // 잔고 데이터 가져오기
          const balanceResponse = await fetch(`/api/get-balance?accountId=${userAccounts[0].id}`);
          const balanceResult = await balanceResponse.json();
          
          if (balanceResult.success) {
            console.log('잔고 데이터:', balanceResult.data);
            // 잔고 데이터를 상태에 저장
            setBalance(balanceResult.data);
          } else {
            console.log('잔고 데이터를 가져오지 못했습니다.');
          }
          
          return;
        } else {
          console.log('일치하는 실제 계좌 정보가 없습니다. 사용자 이메일:', user.email);
          console.log('사용자 목록:', result.data.map((account: any) => account.user?.email));
        }
      }
      
      // 백업 방법: 직접 API 호출
      console.log('백업 방법으로 계좌 정보 가져오기 시도...');
      const backupResponse = await fetch('/api/user/accounts?email=' + encodeURIComponent(user.email));
      const backupResult = await backupResponse.json();
      
      if (backupResult.success && backupResult.data && backupResult.data.accounts && backupResult.data.accounts.length > 0) {
        console.log('백업 방법으로 가져온 실제 계좌 정보:', backupResult.data.accounts);
        setAccounts(backupResult.data.accounts);
        return;
      }
      
      // 계좌 정보가 없는 경우
      console.log('계좌 정보를 찾을 수 없습니다.');
      setError('등록된 계좌 정보가 없습니다. 관리자에게 문의하여 계좌 정보를 등록해주세요.');
    } catch (error) {
      console.error('계좌 정보 가져오기 오류:', error);
      setError('계좌 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      setError('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 날짜 포맷 함수
  const formatAccountDate = (dateString: string) => {
    if (!dateString) return '정보 없음';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('날짜 포맷 오류:', error);
      return '날짜 형식 오류';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {user?.user_metadata?.name || user?.email}님 환영합니다
            </p>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">계좌 정보</h2>
          
          {accounts && accounts.length > 0 ? (
            <ul className="space-y-4">
              {accounts.map((account, index) => (
                <li key={account.id || `account-${index}`} className="p-4 bg-gray-50 rounded-md">
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{account.portfolio_type || '포트폴리오 정보 없음'}</p>
                    <div className="flex">
                      <span className="text-gray-600 w-24 text-sm">계좌번호:</span>
                      <span className="text-gray-900 text-sm">{account.account_number || '정보 없음'}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
              <p>등록된 계좌 정보가 없습니다.</p>
              <p className="text-sm mt-2">관리자에게 문의하여 계좌 정보를 등록해주세요.</p>
            </div>
          )}
        </div>
        
        <Link href="/dashboard/monthly-report" className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">월간 리포트</h2>
          </div>
          <p className="text-gray-600 mb-4">월별 투자 성과와 포트폴리오 분석 리포트를 확인하세요.</p>
          <div className="text-blue-600 font-medium">리포트 보기 &rarr;</div>
        </Link>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">내 정보</h2>
          <div className="space-y-3">
            <div className="flex">
              <span className="font-medium w-20 text-gray-700">이메일:</span> 
              <span className="text-gray-900">{user?.email}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-20 text-gray-700">이름:</span> 
              <span className="text-gray-900">{user?.user_metadata?.name || '미설정'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-20 text-gray-700">연락처:</span> 
              <span className="text-gray-900">{user?.user_metadata?.phone || '미설정'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-20 text-gray-700">가입일:</span> 
              <span className="text-gray-900">{formatAccountDate(user?.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="#" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">연락처</h2>
          </div>
          <p className="text-gray-600">문의사항이 있으시면 연락주세요.</p>
          <p className="text-gray-600 mt-2">이메일: support@example.com</p>
          <p className="text-gray-600">전화: 02-1234-5678</p>
        </Link>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">연체 정보</h2>
          </div>
          <p className="text-gray-600 mb-4">현재 연체 상태 및 납부 예정 금액을 확인하세요.</p>
          <div className="text-blue-600 font-medium">정보 보기 &rarr;</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <RefreshCw className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">리밸런싱 히스토리</h2>
          </div>
          <p className="text-gray-600 mb-4">포트폴리오 리밸런싱 내역과 변경 사항을 확인하세요.</p>
          <div className="text-blue-600 font-medium">히스토리 보기 &rarr;</div>
        </div>
        
        <Link href="/dashboard/consultation" className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">관리자 상담 내역</h2>
          </div>
          <p className="text-gray-600 mb-4">관리자와의 상담 내역 및 문의 답변을 확인하세요.</p>
          <div className="text-purple-600 font-medium">상담 내역 보기 &rarr;</div>
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