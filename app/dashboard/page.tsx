'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, RefreshCw, MessageSquare, Bell, LogOut, User, ChevronRight, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import DashboardAnnouncements from '@/components/dashboard-announcements';

// 공지사항 타입 정의
interface Announcement {
  id: string;
  title: string;
  content: string;
  importance_level: 1 | 2 | 3; // 1: 매우 중요, 2: 중요, 3: 보통
  created_at: string;
}

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
          
          // portfolio_types 테이블에서 포트폴리오 정보 가져오기
          const portfolioResponse = await fetch('/api/portfolios');
          const portfolioResult = await portfolioResponse.json();
          
          if (portfolioResult.data && portfolioResult.data.length > 0) {
            // 계좌 정보에 포트폴리오 정보 추가
            const accountsWithPortfolio = userAccounts.map((account: any) => {
              // portfolio_type_id를 기준으로 포트폴리오 정보 찾기
              const portfolioType = portfolioResult.data.find(
                (p: any) => p.id === account.portfolio_type_id
              );
              
              return {
                ...account,
                portfolio: portfolioType || { name: '알 수 없는 포트폴리오' }
              };
            });
            
            setAccounts(accountsWithPortfolio);
          } else {
            setAccounts(userAccounts);
          }
          
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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">대시보드</h1>
          
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
        
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg animate-fadeIn">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {/* 상단 카드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 내 정보 카드 */}
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute h-1 w-full bg-blue-500 top-0 left-0"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <div className="bg-blue-100 p-1.5 rounded-full mr-2">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                내 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-medium w-20 text-gray-700">이메일:</span> 
                  <span className="text-gray-900">{user?.email}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-20 text-gray-700">이름:</span> 
                  <span className="text-gray-900">{user?.user_metadata?.name || '미설정'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-20 text-gray-700">연락처:</span> 
                  <span className="text-gray-900">{user?.user_metadata?.phone || '미설정'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 계좌 정보 카드 */}
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute h-1 w-full bg-green-500 top-0 left-0"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <div className="bg-green-100 p-1.5 rounded-full mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                계좌 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accounts && accounts.length > 0 ? (
                <ul className="space-y-4">
                  {accounts.map((account, index) => (
                    <li key={account.id || `account-${index}`} className="p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors duration-300 shadow-sm">
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900">{account.portfolio?.name || '포트폴리오 정보 없음'}</p>
                        <div className="flex">
                          <span className="text-gray-600 w-24 text-sm">계좌번호:</span>
                          <span className="text-gray-900 text-sm">{account.account_number || '정보 없음'}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 bg-white text-gray-700 rounded-lg border border-gray-200">
                  <p>등록된 계좌 정보가 없습니다.</p>
                  <p className="text-sm mt-2 text-gray-500">관리자에게 문의하여 계좌 정보를 등록해주세요.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 관리자 연락처 카드 */}
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute h-1 w-full bg-purple-500 top-0 left-0"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <div className="bg-purple-100 p-1.5 rounded-full mr-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
                관리자 연락처
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">문의사항이 있으시면 연락주세요.</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                  <span className="text-gray-600 w-16">이메일:</span>
                  <span className="text-gray-900">support@example.com</span>
                </div>
                <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                  <span className="text-gray-600 w-16">전화:</span>
                  <span className="text-gray-900">02-1234-5678</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 하단 카드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 월간 리포트 카드 */}
          <Link href="/dashboard/monthly-report" className="block group">
            <Card className="h-full border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute h-1 w-full bg-blue-500 top-0 left-0 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full mr-4 group-hover:bg-blue-200 transition-colors duration-300">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">월간 리포트</CardTitle>
                </div>
                <p className="text-gray-600 mb-4">월별 투자 성과와 포트폴리오 분석 리포트를 확인하세요.</p>
                <div className="text-blue-600 font-medium flex items-center">
                  <span>리포트 보기</span>
                  <ChevronRight className="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          {/* 연체 정보 카드 */}
          <Card className="h-full border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
            <div className="absolute h-1 w-full bg-red-500 top-0 left-0 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-full mr-4 group-hover:bg-red-200 transition-colors duration-300">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">연체 정보</CardTitle>
              </div>
              <p className="text-gray-600 mb-4">현재 연체 상태 및 납부 예정 금액을 확인하세요.</p>
              <div className="text-red-600 font-medium flex items-center">
                <span>정보 보기</span>
                <ChevronRight className="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
          
          {/* 리밸런싱 히스토리 카드 */}
          <Card className="h-full border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
            <div className="absolute h-1 w-full bg-green-500 top-0 left-0 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4 group-hover:bg-green-200 transition-colors duration-300">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">리밸런싱 히스토리</CardTitle>
              </div>
              <p className="text-gray-600 mb-4">포트폴리오 리밸런싱 내역과 변경 사항을 확인하세요.</p>
              <div className="text-green-600 font-medium flex items-center">
                <span>히스토리 보기</span>
                <ChevronRight className="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
          
          {/* 관리자 상담 내역 카드 */}
          <Link href="/dashboard/consultation" className="block group">
            <Card className="h-full border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute h-1 w-full bg-purple-500 top-0 left-0 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-full mr-4 group-hover:bg-purple-200 transition-colors duration-300">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">관리자 상담 내역</CardTitle>
                </div>
                <p className="text-gray-600 mb-4">관리자와의 상담 내역 및 문의 답변을 확인하세요.</p>
                <div className="text-purple-600 font-medium flex items-center">
                  <span>상담 내역 보기</span>
                  <ChevronRight className="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        {/* 공지사항 섹션 */}
        <Card className="mb-8 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="absolute h-1 w-full bg-amber-500 top-0 left-0"></div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-amber-100 p-1.5 rounded-full mr-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">공지사항</CardTitle>
              </div>
              <Link href="/dashboard/announcements" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                <span>모든 공지 보기</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <DashboardAnnouncements />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 