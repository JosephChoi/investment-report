import Link from 'next/link';
import { ChevronRight, TrendingUp, BarChart, PieChart, FileText, Bell, AlertCircle, CreditCard, MessageSquare, Mail } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-20 text-white">
        <div className="container mx-auto px-6 md:px-12 py-12 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              자문서비스 정보를 스마트하게 관리하세요
            </h1>
            <p className="text-xl text-blue-100">
              다양한 정보를 안내하고, 기록하며, 확인하실 수 있습니다.
            </p>
            <div className="flex gap-4 mt-4">
              <Link 
                href="/login" 
                className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors duration-200 text-center"
              >
                회원전용 로그인
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex flex-col gap-4">
                <div className="h-14 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 rounded-lg"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 rounded-lg"></div>
                  <div className="h-32 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 rounded-lg"></div>
                </div>
                <div className="h-40 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 rounded-lg"></div>
              </div>
            </div>
            {/* 장식 요소 */}
            <div className="absolute -top-4 -right-4 h-16 w-16 bg-yellow-400 rounded-full opacity-70 blur-sm"></div>
            <div className="absolute -bottom-4 -left-4 h-20 w-20 bg-green-400 rounded-full opacity-70 blur-sm"></div>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              투자를 더 스마트하게 관리하세요
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              우리 서비스는 투자자들이 자신의 포트폴리오를 쉽게 추적하고, 분석하며, 최적화할 수 있는 도구를 제공합니다.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 카드 1: 본인계좌 정보 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <CreditCard className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">본인계좌 정보</h3>
              <p className="text-gray-600">
                본인 보유 계좌 및 관련 정보를 확인하세요
              </p>
            </div>
            
            {/* 카드 2: 월간리포트 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 border border-gray-100">
              <div className="bg-indigo-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <BarChart className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">월간리포트</h3>
              <p className="text-gray-600">
                매월 포트폴리오별 리포트와 계좌 현황을 확인하세요
              </p>
            </div>
            
            {/* 카드 3: 리밸런싱 알림 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 border border-gray-100">
              <div className="bg-green-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <PieChart className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">리밸런싱 알림</h3>
              <p className="text-gray-600">
                포트폴리오 리밸런싱 안내와 히스토리를 관리합니다.
              </p>
            </div>
            
            {/* 카드 4: 관리자 상담내역 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 border border-gray-100">
              <div className="bg-red-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">관리자 상담내역</h3>
              <p className="text-gray-600">
                관리자와 상담하신 내용을 일자별로 확인하세요
              </p>
            </div>
            
            {/* 카드 5: 공지사항 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 border border-gray-100">
              <div className="bg-yellow-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Bell className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">공지사항</h3>
              <p className="text-gray-600">
                투자자문사의 주요한 공지사항을 안내드립니다
              </p>
            </div>
            
            {/* 카드 6: 연체관리 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 border border-gray-100">
              <div className="bg-purple-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <AlertCircle className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">연체관리</h3>
              <p className="text-gray-600">
                수수료 미납사항에 대한 정보를 업데이트 합니다
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA 섹션 */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            다양한 의견을 수렴합니다
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
            제품 사용과 관련한 의견을 주시면 더 좋은 서비스를 위해 반영하도록 하겠습니다.
          </p>
          <a
            href="mailto:kunmin.choi@gmail.com"
            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-lg font-medium transition-colors duration-200 text-lg"
          >
            의견 제시하기
            <Mail className="w-5 h-5" />
          </a>
        </div>
      </section>
      
      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">투자자문 고객관리 서비스</h3>
              <p className="mb-4">
                최고의 투자 포트폴리오 관리 서비스를 제공합니다.
              </p>
            </div>
            
            <div>
              <h4 className="text-white text-lg font-bold mb-4">제품</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">월간리포트제공</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">리밸런싱안내</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">연체관리</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">상담내역관리</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">공지사항</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white text-lg font-bold mb-4">회사 정보</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">소개</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">연락처</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">채용 정보</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">보도 자료</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white text-lg font-bold mb-4">법적 정보</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">이용약관</Link></li>
                <li><Link href="/cookie-policy" className="hover:text-white transition-colors">쿠키 정책</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; 2024 투자자문 고객관리 서비스. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
