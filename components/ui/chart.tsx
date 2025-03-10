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
  TooltipProps,
  Area
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
  try {
    if (!dateString) return '';
    
    // 날짜 문자열을 파싱하여 년, 월 추출
    const date = new Date(dateString);
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // 서버와 클라이언트에서 동일한 결과를 반환하도록 수동으로 포맷팅
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    return `${year}.${month.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    return '';
  }
};

// 월 데이터 추출 함수 (year_month 필드 사용)
const extractYearMonth = (item: any): string => {
  if (item.year_month) {
    return item.year_month;
  }
  
  if (item.date) {
    const date = new Date(item.date);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      return `${year}-${month.toString().padStart(2, '0')}`;
    }
  }
  
  return '';
};

// 툴팁 커스텀 컴포넌트 타입 정의
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{value: number; name: string; payload?: any}>;
  label?: string;
}

// 툴팁 커스텀 컴포넌트
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // 데이터 포인트가 가상인지 확인
    const isVirtual = payload[0]?.payload?.isVirtual;
    const yearMonth = payload[0]?.payload?.year_month || '';
    const value = payload[0]?.value || 0;
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-600 mb-1">{yearMonth || formatDate(label || '')}</p>
        <p className="text-2xl font-bold text-blue-600">
          {formatCurrency(value)}원
        </p>
        {isVirtual && (
          <p className="text-xs text-gray-500 mt-1 italic">
            (예상 데이터)
          </p>
        )}
      </div>
    );
  }
  return null;
};

// BalanceChart 컴포넌트 props 타입 정의
interface BalanceChartProps {
  data?: ChartData[];
}

// 차트 데이터 타입 확장
interface ExtendedChartData extends ChartData {
  isVirtual?: boolean;
  year_month?: string;
}

export default function BalanceChart({ data = [] }: BalanceChartProps) {
  const [chartData, setChartData] = useState<ExtendedChartData[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [hasSingleDataPoint, setHasSingleDataPoint] = useState(false);
  const [uniqueMonths, setUniqueMonths] = useState<string[]>([]);

  // 데이터 처리 및 가공
  useEffect(() => {
    let processedData: ExtendedChartData[] = [];
    
    if (data.length === 0) {
      // 데이터가 없으면 빈 배열 사용
      processedData = [];
      setHasSingleDataPoint(false);
      setUniqueMonths([]);
    } else if (data.length === 1) {
      // 데이터가 하나만 있을 경우 가상의 데이터 포인트 추가
      const singleData = {...data[0], isVirtual: false};
      const singleDate = new Date(singleData.date);
      const currentBalance = singleData.balance;
      
      // 현재 데이터 포인트 기준 한 달 전 가상 데이터 포인트 생성
      const prevMonth = new Date(singleDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      
      // 이전 달 잔고는 현재 잔고의 95%로 가정 (감소 추세)
      const prevBalance = Math.round(currentBalance * 0.95);
      
      const prevMonthData: ExtendedChartData = {
        date: prevMonth.toISOString().split('T')[0],
        balance: prevBalance,
        isVirtual: true
      };
      
      // 현재 데이터 포인트 기준 한 달 후 가상 데이터 포인트 생성
      const nextMonth = new Date(singleDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      // 다음 달 잔고는 현재 잔고의 105%로 가정 (증가 추세)
      const nextBalance = Math.round(currentBalance * 1.05);
      
      const nextMonthData: ExtendedChartData = {
        date: nextMonth.toISOString().split('T')[0],
        balance: nextBalance,
        isVirtual: true
      };
      
      // 가상 데이터 포인트와 실제 데이터 포인트를 합쳐서 차트 데이터 생성
      processedData = [prevMonthData, singleData, nextMonthData];
      console.log('단일 데이터 포인트를 위한 가상 데이터 생성:', processedData);
      
      setHasSingleDataPoint(true);
      setUniqueMonths([
        extractYearMonth(prevMonthData),
        extractYearMonth(singleData),
        extractYearMonth(nextMonthData)
      ]);
    } else {
      // 데이터가 여러 개 있으면 날짜 기준으로 정렬하여 사용
      // 날짜 기준으로 정렬 (과거 -> 최근)
      const sortedData = [...data].sort((a, b) => {
        if (a.year_month && b.year_month) {
          return a.year_month.localeCompare(b.year_month);
        }
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      
      processedData = sortedData.map(item => ({...item, isVirtual: false}));
      setHasSingleDataPoint(false);
      
      // 고유한 year_month 값 추출
      const months = processedData.map(extractYearMonth).filter(Boolean);
      setUniqueMonths([...new Set(months)].sort());
      
      console.log('정렬된 데이터 사용:', processedData.length, '개 데이터 포인트');
    }
    
    // 애니메이션 효과를 위해 데이터를 점진적으로 로드
    const timer = setTimeout(() => {
      setChartData(processedData);
      setIsAnimating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis 
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={(value) => {
            // 해당 데이터 포인트의 year_month 값 찾기
            const item = chartData.find(d => d.date === value);
            if (item && item.year_month) {
              // year_month 형식: "YYYY-MM"
              const parts = item.year_month.split('-');
              if (parts.length === 2) {
                return `${parts[0]}.${parts[1]}`;
              }
            }
            return formatDate(value);
          }}
          // 모든 데이터 포인트를 표시
          ticks={chartData.map(d => d.date)}
        />
        <YAxis 
          tickFormatter={(value) => `${value / 10000}만`}
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
          domain={['dataMin - 1000000', 'dataMax + 1000000']}
        />
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
        />
        <Legend 
          wrapperStyle={{
            paddingTop: '15px',
            color: '#333'
          }}
        />
        {hasSingleDataPoint ? (
          // 단일 데이터 포인트가 있는 경우 가상 데이터와 실제 데이터를 구분하여 표시
          <>
            {/* 가상 데이터 포인트 (점선) */}
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 5, fill: '#94A3B8', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, fill: '#94A3B8', strokeWidth: 2, stroke: '#fff' }}
              name="예상 잔고"
              isAnimationActive={isAnimating}
              animationDuration={1500}
              connectNulls={true}
              // 실제 데이터 포인트만 표시하기 위한 필터
              data={chartData.map(item => item.isVirtual ? {...item, balance: item.balance} : {...item, balance: null})}
            />
            {/* 실제 데이터 포인트 (실선) */}
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#0EA5E9"
              strokeWidth={3}
              dot={{ r: 7, fill: '#0EA5E9', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 9, fill: '#0EA5E9', strokeWidth: 2, stroke: '#fff' }}
              name="실제 잔고"
              isAnimationActive={isAnimating}
              animationDuration={1500}
              connectNulls={true}
              // 가상 데이터 포인트만 표시하기 위한 필터
              data={chartData.map(item => !item.isVirtual ? {...item, balance: item.balance} : {...item, balance: null})}
            />
          </>
        ) : (
          // 여러 데이터 포인트가 있는 경우 일반적인 선 차트 표시
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#0EA5E9"
            strokeWidth={3}
            dot={{ r: 6, fill: '#0EA5E9', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 8, fill: '#0EA5E9', strokeWidth: 2, stroke: '#fff' }}
            name="월별 잔고"
            isAnimationActive={isAnimating}
            animationDuration={1500}
            connectNulls={true}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
} 