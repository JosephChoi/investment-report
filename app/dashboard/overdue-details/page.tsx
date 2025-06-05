'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Info, Home, FileText, CreditCard, Bell } from 'lucide-react';
import { CustomerOverdueInfo, OverduePayment, OverduePaymentNotice } from '@/lib/overdue-types';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function OverdueDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [overdueInfo, setOverdueInfo] = useState<CustomerOverdueInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<OverduePaymentNotice | null>(null);
  const [noticeLoading, setNoticeLoading] = useState(true);

  // 사용자 ID 가져오기
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    getUserId();
  }, []);

  // 연체정보 가져오기
  useEffect(() => {
    const fetchOverdueInfo = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/overdue-payments/user?userId=${userId}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '연체정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setOverdueInfo(data.data);
      } catch (err) {
        console.error('연체정보 조회 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueInfo();
  }, [userId]);

  // 최신 연체정보 안내문 가져오기
  useEffect(() => {
    const fetchLatestNotice = async () => {
      try {
        setNoticeLoading(true);
        const response = await fetch('/api/overdue-payment-notices/latest', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('연체정보 안내문을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setNotice(data.data);
      } catch (err) {
        console.error('연체정보 안내문 조회 오류:', err);
      } finally {
        setNoticeLoading(false);
      }
    };

    fetchLatestNotice();
  }, []);

  // 연체상태 표시 함수
  const renderOverdueStatus = (status: string | null) => {
    if (!status) {
      return <span className="font-bold text-gray-800">당월연체</span>;
    } else if (status === '3달') {
      return <span className="font-bold text-red-600">3개월이상 연체중인 계좌입니다</span>;
    } else {
      return <span className="font-bold">{status}</span>;
    }
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
        {/* 네비게이션 */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/dashboard" 
            className="group flex items-center text-blue-600 hover:text-blue-800 transition-all duration-300 transform hover:-translate-x-1"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-medium">뒤로가기</span>
          </Link>
          
          <Link 
            href="/dashboard" 
            className="group flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:translate-x-1 shadow-lg hover:shadow-xl"
          >
            <span className="font-medium mr-2">대시보드로 이동</span>
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
          </Link>
        </div>
        
        {/* 제목 섹션 */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">연체정보 상세</h1>
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
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <h2 className="font-bold text-xl">오류 발생</h2>
            </div>
            <p className="text-lg ml-11">{error}</p>
          </div>
        ) : !overdueInfo || !overdueInfo.hasOverdue ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-center flex-col py-8">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-medium mb-2 text-gray-800">연체정보가 없습니다</h2>
              <p className="text-gray-600 text-center">
                현재 연체된 계좌가 없습니다. 모든 납부가 정상적으로 이루어졌습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 요약 정보 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">연체정보 요약</h2>
              </div>
              <p className="text-gray-800 ml-11">
                고객님의 계좌에 <span className="text-red-600 font-bold">{overdueInfo.overduePayments.length}건</span>의 연체가 확인되었습니다.
              </p>
            </div>
            
            {/* 계좌별 연체 정보 */}
            {overdueInfo.overduePayments.map((payment, index) => (
              <div key={payment.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">계좌 {index + 1}: {payment.mp_name || '인모스트 연금'}</h2>
                  </div>
                  
                  <div className="ml-11">
                    {/* 계좌 정보 헤더 */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <Info className="h-5 w-5 text-blue-600 mr-2" />
                        계좌 정보
                      </h3>
                    </div>
                    
                    {/* 계좌 정보 테이블 */}
                    <div className="bg-white/50 rounded-xl overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        <div className="grid grid-cols-3 gap-4 py-3 px-4">
                          <div className="font-medium text-gray-700">계좌번호</div>
                          <div className="col-span-2 font-bold text-gray-900">{payment.account_number}</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 py-3 px-4">
                          <div className="font-medium text-gray-700">출금계좌</div>
                          <div className="col-span-2 font-bold text-gray-900">{payment.withdrawal_account || '-'}</div>
                        </div>
                        
                        {/* 계좌번호와 출금계좌가 다를 경우 비고란 추가 */}
                        {payment.withdrawal_account && payment.withdrawal_account !== payment.account_number && (
                          <div className="grid grid-cols-3 gap-4 py-3 px-4 bg-yellow-50/70">
                            <div className="font-medium text-yellow-800">비고</div>
                            <div className="col-span-2 text-yellow-800 font-bold flex items-start">
                              <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                              <span>수수료 출금계좌가 자문계좌와 다릅니다.</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-4 py-3 px-4">
                          <div className="font-medium text-gray-700">포트폴리오</div>
                          <div className="col-span-2 font-bold text-gray-900">{payment.mp_name || '-'}</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 py-3 px-4">
                          <div className="font-medium text-gray-700">미납금액</div>
                          <div className="col-span-2 text-red-600 font-bold text-lg">{formatCurrency(payment.unpaid_amount || 0)}</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 py-3 px-4">
                          <div className="font-medium text-gray-700">연체상태</div>
                          <div className="col-span-2">{renderOverdueStatus(payment.overdue_status)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 연체정보 안내문 */}
            {noticeLoading ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ) : notice ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">안내 사항</h2>
                  </div>
                  <div 
                    className="prose prose-sm max-w-none ml-11 text-gray-800"
                    dangerouslySetInnerHTML={{ __html: notice.content }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// 애니메이션 효과를 위한 CSS 추가
const styles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
`;

// 스타일 태그를 head에 추가
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
} 