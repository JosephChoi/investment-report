'use client';

import dynamic from 'next/dynamic';

// 포트폴리오 리포트 컴포넌트를 동적으로 불러옵니다
const PortfolioReport = dynamic(() => import('@/components/portfolio-report'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">포트폴리오 리포트를 불러오는 중...</p>
    </div>
  ),
});

export default function PortfolioReportWrapper() {
  return <PortfolioReport />;
} 