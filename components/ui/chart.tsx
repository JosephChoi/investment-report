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

// 툴팁 커스텀 컴포넌트 - 금융 전문가용 디자인
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // 데이터 포인트가 가상인지 확인
    const isVirtual = payload[0]?.payload?.isVirtual;
    const yearMonth = payload[0]?.payload?.year_month || '';
    const value = payload[0]?.value || 0;
    
    return (
      <div className="bg-white/95 backdrop-blur-sm p-5 border border-gray-200/80 rounded-xl shadow-xl" 
           style={{
             boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
             borderColor: '#e2e8f0'
           }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <p className="font-semibold text-gray-700 text-sm tracking-wide">
            {yearMonth || formatDate(label || '')}
          </p>
        </div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">
          {formatCurrency(value)}원
        </p>
        {isVirtual && (
          <div className="mt-2 px-2 py-1 bg-gray-100 rounded-md">
            <p className="text-xs text-gray-600 font-medium">
              예상 데이터
            </p>
          </div>
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
        margin={{ top: 30, right: 40, left: 60, bottom: 30 }}
      >
        {/* 세련된 그리드 - 수평선만 표시, 더 미묘한 색상 */}
        <CartesianGrid 
          strokeDasharray="1 3" 
          stroke="#e1e5e9" 
          vertical={false}
          strokeWidth={0.8}
          opacity={0.6}
        />
        
        {/* X축 스타일링 개선 */}
        <XAxis 
          dataKey="date"
          tick={{ 
            fill: '#475569', 
            fontSize: 11, 
            fontWeight: 500,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
          tickLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
          axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
          tickFormatter={(value) => {
            const item = chartData.find(d => d.date === value);
            if (item && item.year_month) {
              const parts = item.year_month.split('-');
              if (parts.length === 2) {
                return `${parts[0]}.${parts[1]}`;
              }
            }
            return formatDate(value);
          }}
          ticks={chartData.map(d => d.date)}
          tickMargin={12}
        />
        
        {/* Y축 스타일링 개선 */}
        <YAxis 
          tickFormatter={(value) => {
            const millions = Math.round(value / 10000);
            return `${millions.toLocaleString('ko-KR')}만`;
          }}
          tick={{ 
            fill: '#475569', 
            fontSize: 11, 
            fontWeight: 500,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
          tickLine={false}
          axisLine={false}
          domain={['dataMin - 1000000', 'dataMax + 1000000']}
          tickMargin={8}
          width={50}
        />
        
        {/* 툴팁 - 기존 커스텀 유지 */}
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ 
            stroke: '#64748b', 
            strokeWidth: 1.5, 
            strokeDasharray: '4 4',
            opacity: 0.7 
          }}
        />
        
        {/* 범례 스타일링 개선 */}
        <Legend 
          wrapperStyle={{
            paddingTop: '20px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#475569',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
          iconType="line"
        />
        
        {hasSingleDataPoint ? (
          <>
            {/* 가상 데이터 포인트 - 더 미묘한 스타일 */}
            <Line
              type="linear"
              dataKey="balance"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 4, fill: '#94a3b8', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ 
                r: 6, 
                fill: '#94a3b8', 
                strokeWidth: 2, 
                stroke: '#ffffff',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
              name="예상 잔고"
              isAnimationActive={isAnimating}
              animationDuration={1500}
              connectNulls={true}
              data={chartData.map(item => item.isVirtual ? {...item, balance: item.balance} : {...item, balance: null})}
            />
            
            {/* 실제 데이터 포인트 - 금융 전문가용 색상 */}
            <Line
              type="linear"
              dataKey="balance"
              stroke="#1e40af"
              strokeWidth={3}
              dot={{ 
                r: 5, 
                fill: '#1e40af', 
                strokeWidth: 3, 
                stroke: '#ffffff',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
              }}
              activeDot={{ 
                r: 7, 
                fill: '#1e40af', 
                strokeWidth: 3, 
                stroke: '#ffffff',
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))'
              }}
              name="실제 잔고"
              isAnimationActive={isAnimating}
              animationDuration={1500}
              connectNulls={true}
              data={chartData.map(item => !item.isVirtual ? {...item, balance: item.balance} : {...item, balance: null})}
            />
          </>
        ) : (
          /* 일반 차트 - 프리미엄 금융 스타일 */
          <Line
            type="linear"
            dataKey="balance"
            stroke="#1e40af"
            strokeWidth={3}
            dot={{ 
              r: 5, 
              fill: '#1e40af', 
              strokeWidth: 3, 
              stroke: '#ffffff',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
            }}
            activeDot={{ 
              r: 7, 
              fill: '#1e40af', 
              strokeWidth: 3, 
              stroke: '#ffffff',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))'
            }}
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