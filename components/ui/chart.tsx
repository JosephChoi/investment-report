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

// 샘플 데이터 타입 정의
interface DataPoint {
  month: string;
  balance: number;
}

// 샘플 데이터
const sampleData: DataPoint[] = [
  { month: '2023-10', balance: 45000000 },
  { month: '2023-11', balance: 47500000 },
  { month: '2023-12', balance: 46800000 },
  { month: '2024-01', balance: 48200000 },
  { month: '2024-02', balance: 50000000 },
  { month: '2024-03', balance: 52500000 },
];

// 숫자 포맷팅 함수
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value);
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
        <p className="font-medium text-gray-900">{label}</p>
        <p className="font-bold text-gray-900">
          {formatCurrency(payload[0].value)}원
        </p>
      </div>
    );
  }
  return null;
};

export default function BalanceChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);

  // 실제 구현에서는 API에서 데이터를 가져오는 로직으로 대체
  useEffect(() => {
    // 애니메이션 효과를 위해 데이터를 점진적으로 로드
    const timer = setTimeout(() => {
      setData(sampleData);
      setIsAnimating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          tick={{ fill: '#333' }}
          tickLine={{ stroke: '#ccc' }}
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