'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, TrendingUp, BarChart, PieChart, FileText, Bell, AlertCircle, CreditCard, MessageSquare, Mail } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 py-16 md:py-20 text-white">
        <div className="container mx-auto px-6 md:px-12 py-8 md:py-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="md:w-1/2 flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col items-start mb-4 md:mb-6">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent drop-shadow-sm">
                Advisor Report
              </h1>
              <div className="w-24 h-1 bg-yellow-400 mt-3 mb-6 rounded-full"></div>
            </div>
            <h2 className="text-xl md:text-2xl font-medium leading-tight text-white drop-shadow">
              자문서비스 정보를 <span className="bg-blue-500 px-2 py-1 rounded">스마트하게</span> 관리하세요
            </h2>
            <p className="text-base md:text-lg text-blue-100 border-l-4 border-blue-400 pl-3 my-4">
              다양한 정보를 안내하고, 기록하며, 확인하실 수 있습니다.
            </p>
            <div className="flex gap-4 mt-4">
              <Link 
                href="/login" 
                className="group relative bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-md font-medium transition-all duration-300 text-center shadow-md hover:shadow-lg hover:translate-y-[-2px] active:translate-y-[1px]"
              >
                <span className="relative z-10">회원전용 로그인</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="bg-blue-500/30 backdrop-blur-sm rounded-lg p-6 border border-blue-400/20 shadow-xl overflow-hidden">
              {/* 대시보드 시각화 */}
              <div className="flex flex-col gap-4">
                {/* 상단 네비게이션 바 */}
                <div className="h-10 bg-white/90 rounded-md flex items-center px-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <div className="flex-1"></div>
                  <div className="w-6 h-6 rounded-full bg-blue-100"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* 차트 1: 원형 차트 */}
                  <div className="h-32 bg-white/90 rounded-md p-3 flex flex-col">
                    <div className="text-xs text-gray-500 mb-1 font-medium">투자 비중</div>
                    <div className="flex-1 flex justify-center items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-blue-500 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1/2 h-full bg-indigo-500"></div>
                        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-green-500"></div>
                        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-yellow-500"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 차트 2: 막대 차트 */}
                  <div className="h-32 bg-white/90 rounded-md p-3 flex flex-col">
                    <div className="text-xs text-gray-500 mb-1 font-medium">월별 수익률</div>
                    <div className="flex-1 flex items-end justify-around">
                      <div className="w-3 bg-blue-500 rounded-t-sm" style={{ height: '30%' }}></div>
                      <div className="w-3 bg-blue-500 rounded-t-sm" style={{ height: '50%' }}></div>
                      <div className="w-3 bg-blue-500 rounded-t-sm" style={{ height: '20%' }}></div>
                      <div className="w-3 bg-blue-500 rounded-t-sm" style={{ height: '60%' }}></div>
                      <div className="w-3 bg-blue-500 rounded-t-sm" style={{ height: '40%' }}></div>
                      <div className="w-3 bg-blue-500 rounded-t-sm" style={{ height: '70%' }}></div>
                    </div>
                  </div>
                </div>
                
                {/* 테이블 */}
                <div className="h-40 bg-white/90 rounded-md p-3 flex flex-col">
                  <div className="text-xs text-gray-500 mb-2 font-medium">자산 현황</div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex justify-between items-center border-b pb-1">
                      <div className="text-xs font-medium">국내 주식</div>
                      <div className="text-xs text-blue-600">32,560,000원</div>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1">
                      <div className="text-xs font-medium">해외 주식</div>
                      <div className="text-xs text-blue-600">15,270,000원</div>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1">
                      <div className="text-xs font-medium">채권</div>
                      <div className="text-xs text-blue-600">8,720,000원</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-medium">현금성 자산</div>
                      <div className="text-xs text-blue-600">3,450,000원</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 장식 요소 */}
            <div className="absolute top-4 right-4 h-12 w-12 md:h-16 md:w-16 bg-yellow-400 rounded-full opacity-50 blur-sm"></div>
            <div className="absolute -bottom-3 -left-3 md:-bottom-4 md:-left-4 h-16 w-16 md:h-20 md:w-20 bg-green-400 rounded-full opacity-50 blur-sm"></div>
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
              <div className="flex items-center mb-4">
                <h3 className="text-white text-xl md:text-2xl font-bold">Advisor Report</h3>
              </div>
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
            <p>&copy; 2024 Advisor Report. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
