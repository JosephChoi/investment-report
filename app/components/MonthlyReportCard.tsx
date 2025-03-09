'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FileText } from 'lucide-react';

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
  
  return (
    <Link href={`/dashboard/monthly-report/${yearStr}/${monthStr}`} className="block">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md hover:border-gray-200 h-full">
        <div className="relative h-40 w-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                console.error('이미지 로드 오류:', e);
                // 이미지 로드 실패 시 기본 이미지로 대체
                e.currentTarget.src = `https://placehold.co/800x400/png?text=${year}년+${month}월+리포트`;
              }}
              unoptimized // 외부 이미지 최적화 비활성화
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="text-sm text-blue-600 font-medium mb-2">
            {year}년 {month}월
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>
    </Link>
  );
} 