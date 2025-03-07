import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: '투자 관리 대시보드',
  description: '고객의 투자 현황을 한눈에 확인할 수 있는 대시보드입니다.',
};

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">투자 관리 대시보드</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 월간리포트 카드 */}
        <Link href="/dashboard/monthly-report" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">월간리포트</h2>
              <p className="text-gray-600 text-sm">월별 투자 현황 및 포트폴리오 리포트를 확인하세요.</p>
            </div>
          </div>
        </Link>
        
        {/* 연체정보 확인 카드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-gray-700" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">연체정보 확인</h2>
            <p className="text-gray-600 text-sm">연체 내역 및 상환 일정을 확인할 수 있습니다.</p>
          </div>
        </div>
        
        {/* 리밸런싱 히스토리 카드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-8 h-8 text-gray-700" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">리밸런싱 히스토리</h2>
            <p className="text-gray-600 text-sm">포트폴리오 리밸런싱 내역을 확인할 수 있습니다.</p>
          </div>
        </div>
        
        {/* 관리자 상담 내역 카드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-700" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">관리자 상담 내역</h2>
            <p className="text-gray-600 text-sm">관리자와의 상담 내역을 확인할 수 있습니다.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">최근 알림</h2>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="space-y-4">
            <div className="pb-4 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">3월 포트폴리오 리포트가 업데이트되었습니다.</h3>
                  <p className="text-sm text-gray-600 mt-1">월간리포트에서 최신 포트폴리오 현황을 확인하세요.</p>
                </div>
                <span className="text-xs text-gray-500">2024.03.15</span>
              </div>
            </div>
            <div className="pb-4 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">포트폴리오 리밸런싱이 완료되었습니다.</h3>
                  <p className="text-sm text-gray-600 mt-1">리밸런싱 히스토리에서 자세한 내용을 확인하세요.</p>
                </div>
                <span className="text-xs text-gray-500">2024.03.10</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">관리자 상담 답변이 등록되었습니다.</h3>
                  <p className="text-sm text-gray-600 mt-1">관리자 상담 내역에서 답변을 확인하세요.</p>
                </div>
                <span className="text-xs text-gray-500">2024.03.05</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 