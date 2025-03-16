'use client';

import { useState, useEffect } from 'react';
import OverduePaymentCard from '@/components/overdue-payment-card';
import { CustomerOverdueInfo } from '@/lib/overdue-types';

export default function DashboardOverduePayments() {
  const [loading, setLoading] = useState(true);
  const [overdueInfo, setOverdueInfo] = useState<CustomerOverdueInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverdueInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/overdue-payments/user', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('연체정보를 불러오는데 실패했습니다.');
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
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">연체정보</h2>
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">연체정보</h2>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p>연체정보를 불러오는데 문제가 발생했습니다.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!overdueInfo) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">연체정보</h2>
        <p>연체정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { hasOverdue, overduePayments, notice } = overdueInfo;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">연체정보</h2>
      
      {hasOverdue ? (
        <div className="space-y-4">
          {overduePayments.map((payment) => (
            <OverduePaymentCard key={payment.id} overduePayment={payment} />
          ))}
        </div>
      ) : (
        <div className="p-4 mb-4 border-l-4 border-l-green-500 bg-green-50 rounded-md">
          <div className="flex items-center">
            <div className="mr-3 text-green-500 text-xl">✓</div>
            <div>
              <h3 className="font-medium">연체 없음</h3>
              <p className="text-sm text-gray-600">현재 연체된 계좌가 없습니다.</p>
            </div>
          </div>
        </div>
      )}
      
      {notice && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">안내사항</h3>
          <div 
            className="prose prose-sm max-w-none p-4 bg-blue-50 rounded-md"
            dangerouslySetInnerHTML={{ __html: notice.content }}
          />
        </div>
      )}
    </div>
  );
} 