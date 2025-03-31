'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { RebalancingHistory } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardRebalancing() {
  const [rebalancingHistories, setRebalancingHistories] = useState<RebalancingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRebalancingHistories = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          console.log('세션 또는 사용자 ID가 없습니다.');
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
        setRebalancingHistories(data?.all || []);
      } catch (error) {
        console.log('리밸런싱 내역 조회 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRebalancingHistories();
  }, []);

  const handleHistoryClick = (historyId: string) => {
    router.push(`/rebalancing-history?id=${historyId}`);
  };

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <div className="absolute h-1 w-full bg-green-500 top-0 left-0"></div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-100 p-1.5 rounded-full mr-2">
                <RefreshCw className="w-4 h-4 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">리밸런싱 내역</CardTitle>
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

  const hasRebalancing = rebalancingHistories.length > 0;
  const latestRebalancing = hasRebalancing ? rebalancingHistories[0] : null;

  return (
    <Card className="border-gray-200 shadow-sm">
      <div className="absolute h-1 w-full bg-green-500 top-0 left-0"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-green-100 p-1.5 rounded-full mr-2">
              <RefreshCw className="w-4 h-4 text-green-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">리밸런싱 내역</CardTitle>
          </div>
          <Link href="/rebalancing-history" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <span>모두 보기</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {hasRebalancing ? (
          <div 
            className="cursor-pointer hover:bg-gray-50 transition-colors rounded-md p-3"
            onClick={() => latestRebalancing && handleHistoryClick(latestRebalancing.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {latestRebalancing?.portfolio_details?.name || '포트폴리오'} 리밸런싱
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(latestRebalancing?.rebalancing_date || '').toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-xs text-green-600 font-medium">
                외 {rebalancingHistories.length - 1}건
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">리밸런싱 내역이 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 