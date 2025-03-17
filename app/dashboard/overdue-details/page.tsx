'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
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

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 text-lg transition-colors duration-200">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>대시보드로 돌아가기</span>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8 text-gray-800">연체정보 상세</h1>
        
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-6">
                  <div className="h-6 bg-gray-200 rounded w-full"></div>
                  <div className="h-6 bg-gray-200 rounded w-full"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-lg border border-red-200 shadow-sm transform transition-all duration-300 hover:shadow-md">
            <h2 className="font-bold text-xl mb-3">오류 발생</h2>
            <p className="text-lg">{error}</p>
          </div>
        ) : !overdueInfo || !overdueInfo.hasOverdue ? (
          <div className="bg-white rounded-lg shadow-md p-8 transform transition-all duration-300 hover:shadow-lg animate-fade-in">
            <div className="flex items-center justify-center flex-col py-10">
              <div className="bg-green-100 p-4 rounded-full mb-6">
                <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-medium mb-3 text-gray-800">연체정보가 없습니다</h2>
              <p className="text-lg text-gray-600 text-center">
                현재 연체된 계좌가 없습니다. 모든 납부가 정상적으로 이루어졌습니다.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm transform transition-all duration-300 hover:shadow-lg animate-fade-in">
              <p className="text-lg font-medium text-gray-800">
                고객님의 계좌에 <span className="text-red-600 font-bold">{overdueInfo.overduePayments.length}건</span>의 연체가 확인되었습니다.
              </p>
            </div>
            
            {overdueInfo.overduePayments.map((payment, index) => (
              <div key={payment.id} className="mb-8 transform transition-all duration-300 hover:translate-y-[-4px] animate-fade-in" style={{animationDelay: `${index * 150}ms`}}>
                <h2 className="text-xl font-bold mb-4 text-gray-800">계좌 {index + 1}: {payment.mp_name || '인모스트 연금'}</h2>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="p-5 border-b border-gray-200 bg-blue-50">
                    <h3 className="text-lg font-medium text-gray-800">계좌 정보</h3>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    <div className="flex border-b">
                      <div className="w-1/3 py-4 px-5 bg-gray-50 font-medium text-gray-800">계좌번호</div>
                      <div className="w-2/3 py-4 px-5 text-gray-800">{payment.account_number}</div>
                    </div>
                    
                    <div className="flex border-b">
                      <div className="w-1/3 py-4 px-5 bg-gray-50 font-medium text-gray-800">출금계좌</div>
                      <div className="w-2/3 py-4 px-5 text-gray-800">{payment.withdrawal_account || '-'}</div>
                    </div>
                    
                    <div className="flex border-b">
                      <div className="w-1/3 py-4 px-5 bg-gray-50 font-medium text-gray-800">대표MP명</div>
                      <div className="w-2/3 py-4 px-5 text-gray-800">{payment.mp_name || '-'}</div>
                    </div>
                    
                    <div className="flex border-b">
                      <div className="w-1/3 py-4 px-5 bg-gray-50 font-medium text-gray-800">미납금액</div>
                      <div className="w-2/3 py-4 px-5 text-red-600 font-bold">{formatCurrency(payment.unpaid_amount || 0)}</div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-1/3 py-4 px-5 bg-gray-50 font-medium text-gray-800">연체상태</div>
                      <div className="w-2/3 py-4 px-5 text-gray-800">{payment.overdue_status || '단일연체'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 연체정보 안내문 - Supabase에서 가져온 내용 */}
            {noticeLoading ? (
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ) : notice ? (
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transform transition-all duration-300 hover:shadow-md animate-fade-in">
                <div className="p-5 border-b border-gray-200 bg-blue-50">
                  <h2 className="text-lg font-medium text-gray-800">안내 사항</h2>
                </div>
                <div 
                  className="prose prose-sm max-w-none p-5 text-gray-800"
                  dangerouslySetInnerHTML={{ __html: notice.content }}
                />
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