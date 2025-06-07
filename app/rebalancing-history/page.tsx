'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, RotateCcw, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RebalancingHistory, Portfolio } from '@/lib/types';
import RebalancingHistoryList from '@/components/rebalancing-history-list';
import RebalancingHistoryDetail from '@/components/rebalancing-history-detail';
import Link from 'next/link';

export default function RebalancingHistoryPage() {
  const [rebalancingHistories, setRebalancingHistories] = useState<{
    current: RebalancingHistory[];
    past: RebalancingHistory[];
    all: RebalancingHistory[];
  }>({ current: [], past: [], all: [] });
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRebalancingHistory, setSelectedRebalancingHistory] = useState<RebalancingHistory | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');
  const router = useRouter();

  // 세션 토큰 가져오기
  const getSessionToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setSessionToken(session.access_token);
        return session.access_token;
      }
      return null;
    } catch (error) {
      console.error('세션 토큰 가져오기 오류:', error);
      return null;
    }
  };

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 가져오기 오류:', error);
          router.push('/login');
          return;
        }
        
        if (session?.user) {
          setUserId(session.user.id);
          
          // 세션 토큰 저장
          if (session.access_token) {
            setSessionToken(session.access_token);
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('사용자 정보 가져오기 오류:', err);
        router.push('/login');
      }
    };
    
    fetchUserInfo();
  }, [router]);

  // 리밸런싱 내역 및 포트폴리오 가져오기
  useEffect(() => {
    if (userId) {
      fetchRebalancingHistories();
      fetchUserPortfolios();
    }
  }, [userId, sessionToken]);

  // 리밸런싱 내역 가져오기
  const fetchRebalancingHistories = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 유효한 세션 토큰이 없는 경우 다시 가져오기
      let token = sessionToken;
      if (!token) {
        token = await getSessionToken();
      }
      
      // 사용자별 리밸런싱 내역 API 호출
      const response = await fetch(`/api/rebalancing-histories/user?userId=${userId}`, {
        method: 'GET',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : undefined
      });
      
      if (!response.ok) {
        throw new Error('리밸런싱 내역을 불러오는데 실패했습니다.');
      }
      
      const { data } = await response.json();
      
      // API 응답 데이터 로깅
      console.log('API 응답 데이터:', data);
      if (data?.all) {
        // 전체 리밸런싱 데이터 날짜 정보 로깅
        console.log('전체 리밸런싱 날짜 목록:', data.all.map((h: RebalancingHistory) => ({
          id: h.id,
          date: h.rebalancing_date,
          portfolio: h.portfolio_type_id
        })));
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('현재 날짜(기준점):', today);

        // 오늘 날짜를 YYYY-MM-DD 형식으로 변환
        const todayStr = today.toISOString().split('T')[0];
        console.log('현재 날짜(문자열):', todayStr);

        // 예정된 리밸런싱: 오늘 이후 날짜
        const current = data.all.filter((history: RebalancingHistory) => {
          // 날짜를 YYYY-MM-DD 형식으로 추출
          const dateStr = history.rebalancing_date.split('T')[0];
          console.log(`리밸런싱 날짜 비교 (문자열): ${history.rebalancing_date} (변환: ${dateStr}) >= ${todayStr} = ${dateStr >= todayStr}`);
          return dateStr >= todayStr;
        });

        // 과거 리밸런싱 내역: 오늘 이전 날짜 (월별 제한 없이 모든 내역 표시)
        const past = data.all.filter((history: RebalancingHistory) => {
          // 날짜를 YYYY-MM-DD 형식으로 추출
          const dateStr = history.rebalancing_date.split('T')[0];
          console.log(`리밸런싱 날짜 비교 (문자열): ${history.rebalancing_date} (변환: ${dateStr}) < ${todayStr} = ${dateStr < todayStr}`);
          return dateStr < todayStr;
        });

        // 날짜 내림차순 정렬 (최신 날짜가 먼저 오도록)
        past.sort((a: RebalancingHistory, b: RebalancingHistory) => new Date(b.rebalancing_date).getTime() - new Date(a.rebalancing_date).getTime());
        
        console.log('분류 후 과거 리밸런싱 내역:', past.map((h: RebalancingHistory) => ({
          id: h.id,
          date: h.rebalancing_date,
          portfolio: h.portfolio_type_id
        })));

        setRebalancingHistories({
          current,
          past,
          all: data.all
        });
      } else {
        setRebalancingHistories({ current: [], past: [], all: [] });
      }
    } catch (err) {
      console.error('리밸런싱 내역 가져오기 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사용자 포트폴리오 가져오기
  const fetchUserPortfolios = async () => {
    if (!userId) return;
    
    try {
      // 유효한 세션 토큰이 없는 경우 다시 가져오기
      let token = sessionToken;
      if (!token) {
        token = await getSessionToken();
      }
      
      const response = await fetch(`/api/portfolios/user?userId=${userId}`, {
        method: 'GET',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : undefined
      });
      
      if (!response.ok) {
        throw new Error('포트폴리오 목록을 불러오는데 실패했습니다.');
      }
      
      const { data } = await response.json();
      setPortfolios(data || []);
    } catch (err) {
      console.error('포트폴리오 가져오기 오류:', err);
    }
  };

  // 상세보기 핸들러
  const handleViewDetail = (rebalancingHistory: RebalancingHistory) => {
    setSelectedRebalancingHistory(rebalancingHistory);
    setShowDetail(true);
  };

  // 상세보기 닫기 핸들러
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedRebalancingHistory(null);
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
        {showDetail && selectedRebalancingHistory ? (
          <RebalancingHistoryDetail
            rebalancingHistory={selectedRebalancingHistory}
            onClose={handleCloseDetail}
          />
        ) : (
          <>
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
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                    <RotateCcw className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">리밸런싱 내역 보기</h1>
                    <p className="text-gray-600 mt-1">보유하신 포트폴리오의 리밸런싱 내역을 확인하실 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
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
                    <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="font-bold text-xl">오류 발생</h2>
                </div>
                <p className="text-lg ml-11">{error}</p>
              </div>
            ) : (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                {/* 탭 네비게이션 */}
                <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 p-6 border-b border-gray-200/50">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      className={`group flex items-center justify-center px-6 py-3 rounded-xl font-medium text-base transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl ${
                        activeTab === 'current'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl scale-105'
                          : 'bg-white/80 text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white border border-gray-200/50'
                      }`}
                      onClick={() => setActiveTab('current')}
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className={`h-5 w-5 transition-transform duration-300 ${activeTab === 'current' ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span>예정된 리밸런싱</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          activeTab === 'current' 
                            ? 'bg-white/20 text-white' 
                            : 'bg-blue-100 text-blue-600 group-hover:bg-white/20 group-hover:text-white'
                        }`}>
                          {rebalancingHistories.current.length}
                        </span>
                      </div>
                    </button>
                    <button
                      className={`group flex items-center justify-center px-6 py-3 rounded-xl font-medium text-base transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl ${
                        activeTab === 'past'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl scale-105'
                          : 'bg-white/80 text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white border border-gray-200/50'
                      }`}
                      onClick={() => setActiveTab('past')}
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className={`h-5 w-5 transition-transform duration-300 ${activeTab === 'past' ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span>과거 리밸런싱 내역</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          activeTab === 'past' 
                            ? 'bg-white/20 text-white' 
                            : 'bg-blue-100 text-blue-600 group-hover:bg-white/20 group-hover:text-white'
                        }`}>
                          {rebalancingHistories.past.length}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 리밸런싱 내역 목록 */}
                <RebalancingHistoryList
                  rebalancingHistories={activeTab === 'current' ? rebalancingHistories.current : rebalancingHistories.past}
                  portfolios={portfolios}
                  onViewDetail={handleViewDetail}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 