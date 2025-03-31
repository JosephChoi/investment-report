'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
      
      if (data?.all) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const current = data.all.filter((history: RebalancingHistory) => {
          const rebalancingDate = new Date(history.rebalancing_date);
          rebalancingDate.setHours(0, 0, 0, 0);
          return rebalancingDate >= today;
        });

        const past = data.all.filter((history: RebalancingHistory) => {
          const rebalancingDate = new Date(history.rebalancing_date);
          rebalancingDate.setHours(0, 0, 0, 0);
          return rebalancingDate < today;
        });

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
    <div className="max-w-5xl mx-auto px-4 py-8 bg-white min-h-screen">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>대시보드로 돌아가기</span>
        </Link>
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-black mb-2">리밸런싱 내역 보기</h1>
          <p className="text-base text-black">보유하신 포트폴리오의 리밸런싱 내역을 확인하실 수 있습니다.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-black">데이터 로딩 중...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {showDetail && selectedRebalancingHistory ? (
            <RebalancingHistoryDetail
              rebalancingHistory={selectedRebalancingHistory}
              onClose={handleCloseDetail}
            />
          ) : (
            <>
              {/* 탭 네비게이션 */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6 py-2">
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-base ${
                      activeTab === 'current'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-black hover:text-blue-600 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('current')}
                  >
                    예정된 리밸런싱 ({rebalancingHistories.current.length})
                  </button>
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-base ${
                      activeTab === 'past'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-black hover:text-blue-600 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('past')}
                  >
                    과거 리밸런싱 내역 ({rebalancingHistories.past.length})
                  </button>
                </nav>
              </div>

              {/* 리밸런싱 내역 목록 */}
              <RebalancingHistoryList
                rebalancingHistories={activeTab === 'current' ? rebalancingHistories.current : rebalancingHistories.past}
                portfolios={portfolios}
                onViewDetail={handleViewDetail}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
} 