import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ChartWrapper from '@/components/chart-wrapper';
import PortfolioReportWrapper from '@/components/portfolio-report-wrapper';

export const metadata: Metadata = {
  title: '월간리포트 | 투자 관리 대시보드',
  description: '월별 투자 현황 및 포트폴리오 리포트를 확인할 수 있습니다.',
};

export default function MonthlyReport() {
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-gray-700 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>대시보드로 돌아가기</span>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6 text-gray-900">월간리포트</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 계좌 정보 카드 */}
        <div className="col-span-1 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">계좌 정보</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">계좌번호</span>
              <span className="font-medium text-gray-900">123-456-789012</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">대표 MP</span>
              <span className="font-medium text-gray-900">성장형 포트폴리오</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">전월 잔고</span>
              <span className="font-medium text-gray-900">50,000,000원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">현재 잔고</span>
              <span className="font-medium text-gray-900">52,500,000원</span>
            </div>
          </div>
        </div>
        
        {/* Monthly Comment 카드 */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">이달의 투자 코멘트</h2>
          <div className="prose text-gray-800">
            <p>
              3월 글로벌 증시는 미국의 인플레이션 우려 완화와 함께 상승세를 보였습니다. 
              특히 기술주 중심의 나스닥이 강세를 보였으며, 한국 증시도 이에 영향을 받아 
              상승 마감했습니다. 다만 원자재 가격 상승과 지정학적 리스크는 여전히 
              불확실성 요인으로 작용하고 있습니다.
            </p>
            <p className="mt-4">
              고객님의 포트폴리오는 이러한 시장 상황에 맞춰 기술주 비중을 적절히 
              유지하면서 안정적인 성과를 달성했습니다. 앞으로도 시장 변동성에 대비하여 
              분산 투자 전략을 유지할 예정입니다.
            </p>
          </div>
          <div className="mt-4 text-right text-sm text-gray-500">
            2023년 3월 15일 업데이트
          </div>
        </div>
        
        {/* 잔고 변화 그래프 카드 */}
        <div className="col-span-1 md:col-span-3 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">잔고 변화 추이</h2>
          <ChartWrapper />
        </div>
        
        {/* 포트폴리오 리포트 카드 */}
        <div className="col-span-1 md:col-span-3 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">포트폴리오 리포트</h2>
          <PortfolioReportWrapper />
        </div>
      </div>
    </div>
  );
} 