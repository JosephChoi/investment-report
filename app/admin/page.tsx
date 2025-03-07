import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, AlertTriangle, RefreshCw, MessageSquare, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: '관리자 페이지 | 투자 관리 대시보드',
  description: '투자 관리 대시보드의 관리자 페이지입니다.',
};

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">관리자 페이지</h1>
      <p className="text-gray-600 mb-8">투자 관리 대시보드의 콘텐츠를 관리할 수 있습니다.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 월간리포트 관리 카드 */}
        <Link href="/admin/monthly-report" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">월간리포트 관리</h2>
                <p className="text-gray-600 text-sm mb-4">월별 고객 리스트, 포트폴리오 자료, 월간 코멘트를 관리합니다.</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>월별 전체 고객 리스트 업로드</li>
                  <li>포트폴리오 자료(JPG) 업로드</li>
                  <li>공통 Monthly Comment 작성</li>
                </ul>
              </div>
            </div>
          </div>
        </Link>
        
        {/* 연체정보 관리 카드 */}
        <Link href="/admin/delinquency" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">연체정보 관리</h2>
                <p className="text-gray-600 text-sm mb-4">고객 연체정보를 관리합니다.</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>연체정보 엑셀 업로드</li>
                  <li>연체정보 수정 및 관리</li>
                </ul>
              </div>
            </div>
          </div>
        </Link>
        
        {/* 리밸런싱 히스토리 관리 카드 */}
        <Link href="/admin/rebalancing" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <RefreshCw className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">리밸런싱 히스토리 관리</h2>
                <p className="text-gray-600 text-sm mb-4">포트폴리오 리밸런싱 내역을 관리합니다.</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>월별 리밸런싱 내용 엑셀 업로드</li>
                  <li>리밸런싱 히스토리 관리</li>
                </ul>
              </div>
            </div>
          </div>
        </Link>
        
        {/* 관리자 상담 내역 관리 카드 */}
        <Link href="/admin/consultation" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <MessageSquare className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">관리자 상담 내역 관리</h2>
                <p className="text-gray-600 text-sm mb-4">고객 상담 내역을 관리합니다.</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>상담 내역 등록 및 수정</li>
                  <li>상담 내역 조회</li>
                </ul>
              </div>
            </div>
          </div>
        </Link>
        
        {/* 최근 알림 관리 카드 */}
        <Link href="/admin/notifications" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <Bell className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">최근 알림 관리</h2>
                <p className="text-gray-600 text-sm mb-4">고객에게 표시될 알림을 관리합니다.</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>공지사항 등록 및 수정</li>
                  <li>알림 관리</li>
                </ul>
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
} 