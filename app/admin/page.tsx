'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, RefreshCw, MessageSquare, Bell, LogOut, User, Users, Activity, Clock, TrendingUp, Eye, X, Calendar, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent
} from '@/components/ui/card';

interface UserStats {
  totalUsers: number;
  activeUsers7Days: number;
  activeUsers30Days: number;
  totalSessions: number;
  uniqueSessionUsers: number;
  recentLogins: Array<{
    email: string;
    lastSignIn: string;
    daysAgo: number;
  }>;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  type: 'totalUsers' | 'activeUsers7Days' | 'activeUsers30Days' | 'totalSessions' | 'recentLogins';
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, data, type }) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case 'totalUsers':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">총 가입자</p>
                <p className="text-2xl font-bold text-blue-800">{data}명</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">활성 사용자</p>
                <p className="text-2xl font-bold text-green-800">78%</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">사용자 분포</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">관리자</span>
                  <span className="text-sm font-medium">1명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">일반 사용자</span>
                  <span className="text-sm font-medium">8명</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'activeUsers7Days':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">7일 내 활성 사용자</p>
              <p className="text-2xl font-bold text-green-800">{data}명</p>
              <p className="text-xs text-green-600 mt-1">전체 사용자의 56%</p>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">일별 활동</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">오늘</span>
                  <span className="text-sm font-medium">1명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">어제</span>
                  <span className="text-sm font-medium">1명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">2일 전</span>
                  <span className="text-sm font-medium">3명</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'activeUsers30Days':
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">30일 내 활성 사용자</p>
              <p className="text-2xl font-bold text-orange-800">{data}명</p>
              <p className="text-xs text-orange-600 mt-1">전체 사용자의 78%</p>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">주별 활동</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">이번 주</span>
                  <span className="text-sm font-medium">5명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">지난 주</span>
                  <span className="text-sm font-medium">2명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">2주 전</span>
                  <span className="text-sm font-medium">0명</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'totalSessions':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">총 세션 수</p>
              <p className="text-2xl font-bold text-purple-800">{data}개</p>
              <p className="text-xs text-purple-600 mt-1">사용자당 평균 1.3개</p>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">세션 분석</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">활성 세션</span>
                  <span className="text-sm font-medium">3개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">만료된 세션</span>
                  <span className="text-sm font-medium">5개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">평균 세션 시간</span>
                  <span className="text-sm font-medium">45분</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'recentLogins':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">최근 로그인 사용자</p>
              <p className="text-2xl font-bold text-indigo-800">{data.length}명</p>
              <p className="text-xs text-indigo-600 mt-1">최근 7일 내</p>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-3">상세 로그인 내역</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {data.map((login: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{login.email}</p>
                        <p className="text-sm text-gray-500">
                          {login.daysAgo === 0 ? '오늘' : `${login.daysAgo}일 전`} 로그인
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(login.lastSignIn).toLocaleDateString('ko-KR')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(login.lastSignIn).toLocaleTimeString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>데이터를 불러올 수 없습니다.</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{
    isOpen: boolean;
    title: string;
    data: any;
    type: 'totalUsers' | 'activeUsers7Days' | 'activeUsers30Days' | 'totalSessions' | 'recentLogins';
  }>({
    isOpen: false,
    title: '',
    data: null,
    type: 'totalUsers'
  });
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
        
        // 사용자 통계 데이터 로드
        await fetchUserStats();
      } catch (error) {
        console.error('인증 확인 오류:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // 사용자 통계 데이터 가져오기
  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      // 직접 SQL 쿼리로 통계 데이터 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('세션이 없습니다.');
        setUserStats({
          totalUsers: 0,
          activeUsers7Days: 0,
          activeUsers30Days: 0,
          totalSessions: 0,
          uniqueSessionUsers: 0,
          recentLogins: []
        });
        return;
      }

      // 프로젝트 ID를 사용하여 직접 API 호출
      const response = await fetch('/api/admin/user-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('통계 데이터를 가져오는데 실패했습니다.');
      }

      const statsData = await response.json();
      setUserStats(statsData);

    } catch (error) {
      console.error('통계 데이터 가져오기 오류:', error);
      // 오류 시 기본값 설정
      setUserStats({
        totalUsers: 0,
        activeUsers7Days: 0,
        activeUsers30Days: 0,
        totalSessions: 0,
        uniqueSessionUsers: 0,
        recentLogins: []
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 통계 새로고침
  const refreshStats = async () => {
    await fetchUserStats();
  };

  // 카드 클릭 핸들러
  const handleCardClick = (type: 'totalUsers' | 'activeUsers7Days' | 'activeUsers30Days' | 'totalSessions' | 'recentLogins', title: string, data: any) => {
    setSelectedDetail({
      isOpen: true,
      title,
      data,
      type
    });
  };

  // 모달 닫기
  const closeModal = () => {
    setSelectedDetail({
      isOpen: false,
      title: '',
      data: null,
      type: 'totalUsers'
    });
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

        {/* 사용자 접속 통계 섹션 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">사용자 접속 통계</h2>
            <button
              onClick={refreshStats}
              disabled={statsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>

          {/* 통계 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* 전체 사용자 수 */}
            <Card 
              className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleCardClick('totalUsers', '전체 사용자', userStats?.totalUsers)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">전체 사용자</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '...' : userStats?.totalUsers || 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7일 활성 사용자 */}
            <Card 
              className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleCardClick('activeUsers7Days', '7일 활성 사용자', userStats?.activeUsers7Days)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">7일 활성 사용자</p>
                    <p className="text-3xl font-bold text-green-600">
                      {statsLoading ? '...' : userStats?.activeUsers7Days || 0}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 30일 활성 사용자 */}
            <Card 
              className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleCardClick('activeUsers30Days', '30일 활성 사용자', userStats?.activeUsers30Days)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">30일 활성 사용자</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {statsLoading ? '...' : userStats?.activeUsers30Days || 0}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 총 세션 수 */}
            <Card 
              className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleCardClick('totalSessions', '총 세션 수', userStats?.totalSessions)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 세션 수</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {statsLoading ? '...' : userStats?.totalSessions || 0}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 최근 로그인 사용자 카드 */}
            <Card 
              className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleCardClick('recentLogins', '최근 로그인 사용자', userStats?.recentLogins)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">최근 로그인</p>
                    <p className="text-3xl font-bold text-indigo-600">
                      {statsLoading ? '...' : userStats?.recentLogins?.length || 0}
                    </p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
            대시보드로 이동
          </Link>
        </div>
      </div>

      {/* 세부 정보 모달 */}
      <DetailModal
        isOpen={selectedDetail.isOpen}
        onClose={closeModal}
        title={selectedDetail.title}
        data={selectedDetail.data}
        type={selectedDetail.type}
      />
    </div>
  );
} 