'use client';

import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';

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
  
  // 배경색 랜덤 선택 (파스텔 계열)
  const bgColors = [
    'from-blue-50 to-indigo-50',
    'from-indigo-50 to-purple-50',
    'from-purple-50 to-pink-50',
    'from-pink-50 to-rose-50',
    'from-rose-50 to-orange-50',
    'from-orange-50 to-amber-50',
    'from-amber-50 to-yellow-50',
    'from-yellow-50 to-lime-50',
    'from-lime-50 to-green-50',
    'from-green-50 to-emerald-50',
    'from-emerald-50 to-teal-50',
    'from-teal-50 to-cyan-50',
    'from-cyan-50 to-blue-50'
  ];
  
  // 월에 따라 배경색 선택 (1월~12월)
  const bgColor = bgColors[month % bgColors.length];
  
  return (
    <Link href={`/dashboard/monthly-report/${yearStr}/${monthStr}`} className="block">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md hover:border-blue-200 h-full">
        <div className={`relative h-48 w-full bg-gradient-to-r ${bgColor}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-gray-800">{year}년</div>
              <div className="text-2xl font-semibold text-blue-600">{monthNames[month]}</div>
            </div>
          </div>
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            월간 리포트
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center mb-3">
            <Calendar className="w-4 h-4 text-blue-600 mr-2" />
            <div className="text-sm text-blue-600 font-medium">
              {year}년 {month}월
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
          <p className="text-gray-600 text-sm mb-4">{description}</p>
          <div className="flex items-center text-blue-600 text-sm font-medium">
            자세히 보기 <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
} 