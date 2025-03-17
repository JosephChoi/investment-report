'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { CustomerOverdueInfo, OverduePayment } from '@/lib/overdue-types';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardOverduePayments() {
  const [loading, setLoading] = useState(true);
  const [overdueInfo, setOverdueInfo] = useState<CustomerOverdueInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasLongOverdue, setHasLongOverdue] = useState(false);

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
        
        // 3개월 이상 연체 계좌가 있는지 확인
        if (data.data && data.data.overduePayments) {
          const longOverdue = data.data.overduePayments.some(
            (payment: OverduePayment) => payment.overdue_status === '3달'
          );
          setHasLongOverdue(longOverdue);
        }
      } catch (err) {
        console.error('연체정보 조회 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueInfo();
  }, [userId]);

  return (
    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full">
      <div className="absolute h-1 w-full bg-red-500 top-0 left-0"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-red-100 p-1.5 rounded-full mr-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">연체 정보</CardTitle>
          </div>
          <Link href="/dashboard/overdue-details" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <span>상세 보기</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            <p>연체정보를 불러오는데 문제가 발생했습니다.</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : !overdueInfo ? (
          <div>
            <p>연체정보를 불러올 수 없습니다.</p>
          </div>
        ) : (
          <Link href="/dashboard/overdue-details" className="block">
            {overdueInfo.hasOverdue ? (
              <div className={`p-4 ${hasLongOverdue ? 'bg-red-100' : 'bg-red-50'} border-l-4 border-l-red-500 rounded-md hover:bg-red-100 transition-colors duration-300`}>
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-red-700 text-lg">
                      <span className="text-red-600 font-bold">{overdueInfo.overduePayments.length}건</span>의 연체정보가 있습니다
                    </p>
                    {hasLongOverdue && (
                      <div className="flex items-center mt-2 bg-red-200 p-2 rounded">
                        <Clock className="h-4 w-4 text-red-600 mr-1 flex-shrink-0" />
                        <p className="text-sm text-red-700 font-bold">
                          3개월 이상 연체중인 계좌가 있습니다
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-red-600 mt-2">
                      자세한 내용을 확인하려면 클릭하세요
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border-l-4 border-l-green-500 bg-green-50 rounded-md hover:bg-green-100 transition-colors duration-300">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-700">연체 없음</h3>
                    <p className="text-sm text-green-600">현재 연체된 계좌가 없습니다.</p>
                  </div>
                </div>
              </div>
            )}
          </Link>
        )}
      </CardContent>
    </Card>
  );
} 