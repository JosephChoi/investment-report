'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps
} from 'recharts';
import { ChartData } from '@/components/chart-wrapper';

// 샘플 데이터
const sampleData: ChartData[] = [
  { date: '2023-10-31', balance: 45000000 },
  { date: '2023-11-30', balance: 47500000 },
  { date: '2023-12-31', balance: 46800000 },
  { date: '2024-01-31', balance: 48200000 },
  { date: '2024-02-29', balance: 50000000 },
  { date: '2024-03-31', balance: 52500000 },
];

// 숫자 포맷팅 함수
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value);
};

// 날짜 포맷팅 함수
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short'
  });
};

// 툴팁 커스텀 컴포넌트 타입 정의
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{value: number; name: string}>;
  label?: string;
}

// 툴팁 커스텀 컴포넌트
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-md shadow-sm">
        <p className="font-medium text-gray-900">{formatDate(label || '')}</p>
        <p className="font-bold text-gray-900">
          {formatCurrency(payload[0].value)}원
        </p>
      </div>
    );
  }
  return null;
};

// BalanceChart 컴포넌트 props 타입 정의
interface BalanceChartProps {
  data?: ChartData[];
}

export default function BalanceChart({ data = [] }: BalanceChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);

  // 데이터가 없으면 샘플 데이터 사용
  useEffect(() => {
    // 애니메이션 효과를 위해 데이터를 점진적으로 로드
    const timer = setTimeout(() => {
      setChartData(data.length > 0 ? data : sampleData);
      setIsAnimating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tick={{ fill: '#333' }}
          tickLine={{ stroke: '#ccc' }}
          tickFormatter={formatDate}
        />
        <YAxis 
          tickFormatter={(value) => `${value / 10000000}천만`}
          tick={{ fill: '#333' }}
          tickLine={{ stroke: '#ccc' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{
            paddingTop: '10px',
            color: '#333'
          }}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#007AFF"
          strokeWidth={3}
          dot={{ r: 6, fill: '#007AFF', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 8, fill: '#007AFF', strokeWidth: 2, stroke: '#fff' }}
          name="잔고"
          isAnimationActive={isAnimating}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 