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
  return (
    <Link href={`/dashboard/monthly-report/${year}/${month}`} className="block">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md hover:border-gray-200 h-full">
        <div className="relative h-40 w-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
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