'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, RefreshCw, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RebalancingHistory, RebalancingHistoryFormData, Portfolio } from '@/lib/types';
import RebalancingHistoryList from '@/components/rebalancing-history-list';
import RebalancingHistoryDetail from '@/components/rebalancing-history-detail';
import RebalancingHistoryForm from '@/components/rebalancing-history-form';
import Link from 'next/link';

export default function AdminRebalancingHistories() {
  const [rebalancingHistories, setRebalancingHistories] = useState<RebalancingHistory[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingRebalancingHistory, setEditingRebalancingHistory] = useState<RebalancingHistory | null>(null);
  const [selectedRebalancingHistory, setSelectedRebalancingHistory] = useState<RebalancingHistory | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const router = useRouter();

  // 세션 토큰 가져오기
  const getSessionToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        console.log('세션 토큰 확보 완료 (길이):', session.access_token.length);
        setSessionToken(session.access_token);
        return session.access_token;
      } else {
        console.error('세션에 액세스 토큰이 없습니다.');
        return null;
      }
    } catch (error) {
      console.error('세션 토큰 가져오기 오류:', error);
      return null;
    }
  };

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
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
        
        // 세션 토큰 가져오기
        await getSessionToken();
        
        // 리밸런싱 내역 목록 가져오기
        fetchRebalancingHistories();
        
        // 포트폴리오 목록 가져오기
        fetchPortfolios();
      } catch (error) {
        console.error('관리자 권한 확인 오류:', error);
        setError('권한을 확인하는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [router]);

  // 리밸런싱 내역 목록 가져오기
  const fetchRebalancingHistories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 유효한 세션 토큰이 없는 경우 다시 가져오기
      let token = sessionToken;
      if (!token) {
        console.log('세션 토큰이 없습니다. 다시 가져오기 시도...');
        token = await getSessionToken();
        
        if (!token) {
          throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
        }
      }
      
      console.log('API 호출 시작: /api/rebalancing-histories');
      
      // API 호출 (Bearer 토큰 인증 사용)
      const response = await fetch('/api/rebalancing-histories', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API 응답 상태:', response.status, response.statusText);
      
      // API 응답이 정상이 아닌 경우
      if (!response.ok) {
        // 응답 본문을 텍스트로 읽기 시도
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('API 에러 응답 (텍스트):', errorText);
          
          // JSON 파싱 시도
          try {
            const errorData = JSON.parse(errorText);
            console.error('API 에러 응답 (JSON):', errorData);
            throw new Error(errorData.error || '리밸런싱 내역을 불러오는데 실패했습니다.');
          } catch (parseError) {
            // JSON 파싱에 실패한 경우 원본 텍스트 사용
            throw new Error(`리밸런싱 내역을 불러오는데 실패했습니다: ${response.status} ${response.statusText}. ${errorText}`);
          }
        } catch (readError) {
          // 응답 읽기 실패 시 기본 오류 메시지 사용
          throw new Error(`리밸런싱 내역을 불러오는데 실패했습니다: ${response.status} ${response.statusText}`);
        }
      }
      
      // 응답 본문 파싱
      const result = await response.json();
      console.log('API 응답 데이터:', result);
      
      // API 응답에서 data 필드가 있는지 확인
      if (result && result.data) {
        console.log('리밸런싱 내역 데이터 로드 성공:', result.data.length, '개 항목');
        setRebalancingHistories(result.data);
      } else {
        // 데이터가 없는 경우 빈 배열 설정
        console.log('API 응답에 데이터가 없습니다. 빈 배열로 설정합니다.');
        setRebalancingHistories([]);
      }
    } catch (err) {
      console.error('리밸런싱 내역 목록 가져오기 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 포트폴리오 목록 가져오기
  const fetchPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolios');
      
      if (!response.ok) {
        throw new Error('포트폴리오 목록을 불러오는데 실패했습니다.');
      }
      
      const { data } = await response.json();
      setPortfolios(data || []);
    } catch (err) {
      console.error('포트폴리오 목록 가져오기 오류:', err);
    }
  };

  // 리밸런싱 내역 생성 핸들러
  const handleCreateRebalancingHistory = async (formData: RebalancingHistoryFormData) => {
    try {
      console.log('리밸런싱 내역 생성 시작');
      
      // 유효한 세션 토큰이 없는 경우 다시 가져오기
      let token = sessionToken;
      if (!token) {
        console.log('세션 토큰이 없습니다. 다시 가져오기 시도...');
        token = await getSessionToken();
        
        if (!token) {
          throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
        }
      }
      
      console.log('리밸런싱 내역 생성 요청 준비 (토큰 길이):', token.length);
      
      // 리밸런싱 내역 생성 API 호출
      const response = await fetch('/api/rebalancing-histories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log('API 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 에러 응답:', errorData);
        throw new Error(errorData.error || '리밸런싱 내역 생성에 실패했습니다.');
      }
      
      // 폼 닫기 및 목록 새로고침
      setShowForm(false);
      fetchRebalancingHistories();
      
      alert('리밸런싱 내역이 성공적으로 생성되었습니다.');
    } catch (err) {
      console.error('리밸런싱 내역 생성 오류:', err);
      alert(err instanceof Error ? err.message : '리밸런싱 내역 생성 중 오류가 발생했습니다.');
      throw err;
    }
  };

  // 리밸런싱 내역 수정 핸들러
  const handleUpdateRebalancingHistory = async (formData: RebalancingHistoryFormData) => {
    if (!editingRebalancingHistory) return;
    
    try {
      // 유효한 세션 토큰이 없는 경우 다시 가져오기
      let token = sessionToken;
      if (!token) {
        console.log('세션 토큰이 없습니다. 다시 가져오기 시도...');
        token = await getSessionToken();
        
        if (!token) {
          throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
        }
      }
      
      // 리밸런싱 내역 수정 API 호출
      const response = await fetch(`/api/rebalancing-histories/${editingRebalancingHistory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '리밸런싱 내역 수정에 실패했습니다.');
      }
      
      // 폼 닫기 및 목록 새로고침
      setShowForm(false);
      setEditingRebalancingHistory(null);
      fetchRebalancingHistories();
      
      alert('리밸런싱 내역이 성공적으로 수정되었습니다.');
    } catch (err) {
      console.error('리밸런싱 내역 수정 오류:', err);
      alert(err instanceof Error ? err.message : '리밸런싱 내역 수정 중 오류가 발생했습니다.');
      throw err;
    }
  };

  // 리밸런싱 내역 삭제 핸들러
  const handleDeleteRebalancingHistory = async (id: string) => {
    try {
      // 유효한 세션 토큰이 없는 경우 다시 가져오기
      let token = sessionToken;
      if (!token) {
        console.log('세션 토큰이 없습니다. 다시 가져오기 시도...');
        token = await getSessionToken();
        
        if (!token) {
          throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
        }
      }
      
      // 리밸런싱 내역 삭제 API 호출
      const response = await fetch(`/api/rebalancing-histories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '리밸런싱 내역 삭제에 실패했습니다.');
      }
      
      // 목록 새로고침
      fetchRebalancingHistories();
      
      alert('리밸런싱 내역이 성공적으로 삭제되었습니다.');
    } catch (err) {
      console.error('리밸런싱 내역 삭제 오류:', err);
      alert(err instanceof Error ? err.message : '리밸런싱 내역 삭제 중 오류가 발생했습니다.');
      throw err;
    }
  };

  // 상세보기 핸들러
  const handleViewDetail = (rebalancingHistory: RebalancingHistory) => {
    setSelectedRebalancingHistory(rebalancingHistory);
    setShowDetail(true);
  };

  // 수정 핸들러
  const handleEdit = (rebalancingHistory: RebalancingHistory) => {
    setEditingRebalancingHistory(rebalancingHistory);
    setShowForm(true);
  };

  // 폼 제출 핸들러
  const handleFormSubmit = async (formData: RebalancingHistoryFormData) => {
    try {
      if (editingRebalancingHistory) {
        // 리밸런싱 내역 수정
        await handleUpdateRebalancingHistory(formData);
      } else {
        // 리밸런싱 내역 생성
        await handleCreateRebalancingHistory(formData);
      }
      
      // 폼 닫기
      setShowForm(false);
      setEditingRebalancingHistory(null);
    } catch (error) {
      console.error('폼 제출 오류:', error);
    }
  };

  // 폼 취소 핸들러
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRebalancingHistory(null);
  };

  // 상세보기 닫기 핸들러
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedRebalancingHistory(null);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">관리자 대시보드로 돌아가기</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">리밸런싱 내역 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            포트폴리오별 리밸런싱 내역을 관리합니다.
          </p>
        </div>
        
        {/* 새 리밸런싱 내역 작성 버튼 */}
        <button
          onClick={() => {
            console.log('새 리밸런싱 내역 작성 버튼 클릭됨');
            setShowForm(true);
            setEditingRebalancingHistory(null);
          }}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span className="flex items-center">
            <Plus className="w-4 h-4 mr-1" />
            새 리밸런싱 내역 작성
          </span>
        </button>
      </div>
      
      {/* 리밸런싱 내역 목록 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">데이터 로딩 중...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {showForm ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingRebalancingHistory ? '리밸런싱 내역 수정' : '새 리밸런싱 내역 작성'}
              </h2>
              <RebalancingHistoryForm
                rebalancingHistory={editingRebalancingHistory || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            </div>
          ) : showDetail && selectedRebalancingHistory ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <RebalancingHistoryDetail
                rebalancingHistory={selectedRebalancingHistory}
                onClose={handleCloseDetail}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <RebalancingHistoryList
                rebalancingHistories={rebalancingHistories}
                portfolios={portfolios}
                onViewDetail={handleViewDetail}
                onEdit={handleEdit}
                onDelete={handleDeleteRebalancingHistory}
                isAdmin={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 