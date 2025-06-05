'use client';

import Link from 'next/link';
import { Calendar, ArrowRight, TrendingUp, TrendingDown, BarChart3, LineChart, PieChart, DollarSign } from 'lucide-react';

interface MonthlyReportCardProps {
  year: number;
  month: number;
  title: string;
  description: string;
  imageUrl: string;
}

export default function MonthlyReportCard({
  year,
  month,
  title,
  description,
  imageUrl
}: MonthlyReportCardProps) {
  // year와 month를 문자열로 변환
  const yearStr = year.toString();
  const monthStr = month.toString().padStart(2, '0');
  
  // 월 이름 배열
  const monthNames = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  // 계절별 테마 색상 (전문적인 금융 테마)
  const getSeasonTheme = (month: number) => {
    if (month >= 3 && month <= 5) return 'spring'; // 봄 - 성장기
    if (month >= 6 && month <= 8) return 'summer'; // 여름 - 활성기
    if (month >= 9 && month <= 11) return 'autumn'; // 가을 - 수확기
    return 'winter'; // 겨울 - 계획기
  };

  // 월별 투자 테마 설정 (도시적이고 세련된 색상)
  const getMonthTheme = (month: number) => {
    const themes = {
      1: { 
        gradient: 'from-slate-200 via-gray-100 to-blue-100', 
        icon: BarChart3, 
        accent: 'slate',
        chartColor: '#0f172a'
      },
      2: { 
        gradient: 'from-gray-200 via-slate-100 to-red-100', 
        icon: TrendingUp, 
        accent: 'red',
        chartColor: '#dc2626'
      },
      3: { 
        gradient: 'from-gray-100 via-slate-100 to-emerald-100', 
        icon: LineChart, 
        accent: 'emerald',
        chartColor: '#059669'
      },
      4: { 
        gradient: 'from-slate-100 via-gray-100 to-violet-100', 
        icon: PieChart, 
        accent: 'violet',
        chartColor: '#7c3aed'
      },
      5: { 
        gradient: 'from-gray-100 via-slate-100 to-green-100', 
        icon: TrendingUp, 
        accent: 'green',
        chartColor: '#10b981'
      },
      6: { 
        gradient: 'from-slate-200 via-gray-100 to-rose-100', 
        icon: BarChart3, 
        accent: 'rose',
        chartColor: '#e11d48'
      },
      7: { 
        gradient: 'from-gray-100 via-slate-100 to-amber-100', 
        icon: LineChart, 
        accent: 'amber',
        chartColor: '#f59e0b'
      },
      8: { 
        gradient: 'from-slate-100 via-gray-100 to-orange-100', 
        icon: TrendingDown, 
        accent: 'orange',
        chartColor: '#ea580c'
      },
      9: { 
        gradient: 'from-gray-200 via-slate-100 to-pink-100', 
        icon: PieChart, 
        accent: 'pink',
        chartColor: '#ec4899'
      },
      10: { 
        gradient: 'from-slate-100 via-gray-100 to-red-100', 
        icon: TrendingDown, 
        accent: 'red',
        chartColor: '#dc2626'
      },
      11: { 
        gradient: 'from-gray-100 via-slate-100 to-yellow-100', 
        icon: BarChart3, 
        accent: 'yellow',
        chartColor: '#eab308'
      },
      12: { 
        gradient: 'from-slate-200 via-gray-100 to-blue-100', 
        icon: DollarSign, 
        accent: 'blue',
        chartColor: '#2563eb'
      }
    };
    
    return themes[month as keyof typeof themes] || themes[1];
  };

  const season = getSeasonTheme(month);
  const monthTheme = getMonthTheme(month);
  const IconComponent = monthTheme.icon;
  
  // 계절별 테두리 색상 (전문적인 색상)
  const seasonBorderColors = {
    spring: 'hover:border-emerald-400',
    summer: 'hover:border-blue-400', 
    autumn: 'hover:border-amber-400',
    winter: 'hover:border-slate-400'
  };

  // 강조 색상 매핑 (전문적인 금융 색상)
  const accentColors = {
    slate: 'text-slate-700 bg-slate-100',
    red: 'text-red-700 bg-red-100',
    emerald: 'text-emerald-700 bg-emerald-100',
    violet: 'text-violet-700 bg-violet-100',
    green: 'text-green-700 bg-green-100',
    rose: 'text-rose-700 bg-rose-100',
    amber: 'text-amber-700 bg-amber-100',
    orange: 'text-orange-700 bg-orange-100',
    pink: 'text-pink-700 bg-pink-100',
    yellow: 'text-yellow-700 bg-yellow-100',
    blue: 'text-blue-700 bg-blue-100'
  };

  // 차트 배경 패턴 생성
  const getChartPattern = () => {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 120">
        {/* 그리드 라인 */}
        <defs>
          <pattern id={`grid-${month}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={monthTheme.chartColor} strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${month})`} />
        
        {/* 차트 라인 */}
        <path 
          d="M 20 80 Q 60 60 100 70 T 180 50" 
          fill="none" 
          stroke={monthTheme.chartColor} 
          strokeWidth="2" 
          opacity="0.6"
        />
        
        {/* 데이터 포인트 */}
        <circle cx="20" cy="80" r="3" fill={monthTheme.chartColor} opacity="0.7"/>
        <circle cx="60" cy="60" r="3" fill={monthTheme.chartColor} opacity="0.7"/>
        <circle cx="100" cy="70" r="3" fill={monthTheme.chartColor} opacity="0.7"/>
        <circle cx="140" cy="55" r="3" fill={monthTheme.chartColor} opacity="0.7"/>
        <circle cx="180" cy="50" r="3" fill={monthTheme.chartColor} opacity="0.7"/>
        
        {/* 면적 차트 */}
        <path 
          d="M 20 80 Q 60 60 100 70 T 180 50 L 180 100 L 20 100 Z" 
          fill={monthTheme.chartColor} 
          opacity="0.1"
        />
      </svg>
    );
  };

  return (
    <Link href={`/dashboard/monthly-report/${yearStr}/${monthStr}`} className="block group">
      <div className={`relative bg-white/90 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-gray-200/80 transition-all duration-500 hover:shadow-xl ${seasonBorderColors[season]} h-full transform hover:-translate-y-2 hover:scale-[1.02] group-hover:bg-white/95`}>
        
        {/* 배경 패턴 영역 - 크기 축소 */}
        <div className={`relative h-40 w-full bg-gradient-to-br ${monthTheme.gradient} overflow-hidden`}>
          {/* 차트 배경 패턴 */}
          {getChartPattern()}
          
          {/* 배경 장식 요소들 - 간소화 */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-4 right-4 w-16 h-16 bg-white/40 rounded-full transform transition-all duration-500 group-hover:scale-110"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/30 rounded-full transform transition-all duration-400 group-hover:scale-105"></div>
          </div>
          
          {/* 투자 아이콘 배경 */}
          <div className="absolute top-4 left-4 opacity-20 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
            <IconComponent className="w-8 h-8" color={monthTheme.chartColor} />
          </div>
          
          {/* 연도/월 표시 영역 - 크기 조정 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4 bg-white/85 backdrop-blur-md rounded-xl shadow-lg border border-white/40 transform transition-all duration-500 group-hover:scale-105 group-hover:bg-white/95">
              <div className="text-2xl font-bold text-gray-800 mb-1 transform transition-all duration-300 group-hover:scale-105">
                {year}년
              </div>
              <div className={`text-xl font-bold transform transition-all duration-300 group-hover:scale-110 ${accentColors[monthTheme.accent as keyof typeof accentColors].split(' ')[0]}`}>
                {monthNames[month]}
              </div>
            </div>
          </div>
          
          {/* 상단 우측 배지 - 크기 조정 */}
          <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg shadow-md transform transition-all duration-300 group-hover:scale-105 text-white font-medium text-xs ${season === 'spring' ? 'bg-emerald-600' : season === 'summer' ? 'bg-blue-600' : season === 'autumn' ? 'bg-amber-600' : 'bg-slate-600'}`}>
            월간 리포트
          </div>
        </div>
        
        {/* 카드 내용 - 패딩 조정 */}
        <div className="p-4 bg-gradient-to-b from-white/95 to-white/100">
          <div className="flex items-center mb-3">
            <div className={`p-2 rounded-lg mr-3 transform transition-all duration-300 group-hover:scale-110 ${accentColors[monthTheme.accent as keyof typeof accentColors]}`}>
              <Calendar className="w-4 h-4" />
            </div>
            <div className={`text-xs font-bold transform transition-all duration-300 group-hover:scale-105 ${accentColors[monthTheme.accent as keyof typeof accentColors].split(' ')[0]}`}>
              {year}년 {month}월
            </div>
          </div>
          
          <h3 className="text-lg font-bold mb-2 text-gray-900 transform transition-all duration-300 group-hover:text-gray-700 leading-tight">
            {title}
          </h3>
          
          <p className="text-gray-600 text-xs mb-3 leading-relaxed transform transition-all duration-300 group-hover:text-gray-500">
            {description}
          </p>
          
          <div className={`flex items-center text-xs font-bold transform transition-all duration-300 group-hover:translate-x-1 ${accentColors[monthTheme.accent as keyof typeof accentColors].split(' ')[0]}`}>
            <span>자세히 보기</span>
            <ArrowRight className="w-3 h-3 ml-1 transform transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110" />
          </div>
        </div>
        
        {/* 3D 효과를 위한 그림자 레이어 */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-transparent to-black/3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </Link>
  );
} 