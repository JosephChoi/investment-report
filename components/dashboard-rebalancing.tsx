'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { RebalancingHistory } from '@/lib/types';
import Link from 'next/link';

interface DashboardRebalancingProps {
  title?: string;
}

export default function DashboardRebalancing({ title = "리밸런싱 안내" }: DashboardRebalancingProps) {
  const [upcomingRebalancing, setUpcomingRebalancing] = useState<RebalancingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRebalancingHistories = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          return;
        }

        const response = await fetch(`/api/rebalancing-histories/user?userId=${session.user.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('리밸런싱 내역을 불러오는데 실패했습니다.');
        }

        const { data } = await response.json();
        
        // 오늘 날짜 이후의 리밸런싱만 필터링
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 오늘 자정을 기준으로 설정
        
        const upcoming = (data?.all || []).filter((history: RebalancingHistory) => {
          const rebalancingDate = new Date(history.rebalancing_date);
          rebalancingDate.setHours(0, 0, 0, 0);
          return rebalancingDate >= today;
        });

        setUpcomingRebalancing(upcoming);
      } catch (error) {
        console.error('리밸런싱 내역 조회 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRebalancingHistories();
  }, []);

  if (loading) {
    return (
      <Card className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="absolute h-1 w-full bg-green-500 top-0 left-0"></div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-100 p-1.5 rounded-full mr-2">
                <RefreshCw className="w-4 h-4 text-green-600" />
              </div>
              <CardTitle className="text-xl text-black">{title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-16">
            <div className="w-5 h-5 border-t-2 border-b-2 border-green-600 rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasUpcomingRebalancing = upcomingRebalancing.length > 0;

  // 예정된 리밸런싱이 없으면 컴포넌트를 렌더링하지 않음
  if (!hasUpcomingRebalancing) {
    return null;
  }

  return (
    <Card className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="absolute h-1 w-full bg-green-500 top-0 left-0"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-green-100 p-1.5 rounded-full mr-2">
              <RefreshCw className="w-4 h-4 text-green-600" />
            </div>
            <CardTitle className="text-xl text-black">{title}</CardTitle>
          </div>
          <Link href="/rebalancing-history" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <span>상세 보기</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="border-l-4 border-green-500 pl-4">
          <p className="text-sm font-medium text-green-800">
            {upcomingRebalancing.length}건의 리밸런싱이 예정되어 있습니다.
          </p>
          <p className="text-xs text-green-600 mt-1">
            상세 내용은 리밸런싱 안내 페이지에서 확인하세요.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 