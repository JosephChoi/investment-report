'use client';

import dynamic from 'next/dynamic';

// 차트 데이터 타입 정의
export interface ChartData {
  date: string;
  balance: number;
  year_month?: string;
}

// 차트 컴포넌트 props 타입 정의
interface ChartWrapperProps {
  data: ChartData[];
}

// 차트 컴포넌트를 동적으로 불러옵니다
const BalanceChart = dynamic(() => import('@/components/ui/chart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
      <p className="text-gray-500">차트를 불러오는 중...</p>
    </div>
  ),
});

export default function ChartWrapper({ data }: ChartWrapperProps) {
  return (
    <div className="h-80 w-full">
      <BalanceChart data={data} />
    </div>
  );
} 