import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 md:px-12 py-16">
        <div className="mb-12">
          <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            메인으로 돌아가기
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">개인정보처리방침</h1>
          <p className="text-gray-500">최종 업데이트: 2024년 6월 1일</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">1. 개인정보의 수집 및 이용 목적</h2>
          <p className="mb-6 text-gray-700">
            투자자문 고객관리 서비스는 다음과 같은 목적으로 개인정보를 수집 및 이용합니다:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>고객 서비스 제공 및 계약의 이행</li>
            <li>서비스 개선 및 개발</li>
            <li>마케팅 및 프로모션 활동 (선택적 동의 시)</li>
            <li>법적 의무 이행 및 권리 행사</li>
            <li>부정 이용 방지</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">2. 수집하는 개인정보 항목</h2>
          <p className="mb-6 text-gray-700">
            당사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>필수항목: 이름, 이메일 주소, 전화번호, 계좌정보</li>
            <li>선택항목: 직업, 투자 성향, 투자 목표</li>
            <li>자동수집항목: IP주소, 쿠키, 방문 일시, 서비스 이용 기록</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">3. 개인정보의 보유 및 이용기간</h2>
          <p className="mb-6 text-gray-700">
            회원의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다. 
            단, 관련 법령에 의한 정보보유 사유가 있는 경우에는 해당 기간 동안 보관합니다.
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
            <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
            <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
            <li>웹사이트 방문기록: 3개월</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">4. 개인정보의 제3자 제공</h2>
          <p className="mb-6 text-gray-700">
            당사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
            다만, 아래의 경우에는 예외로 합니다:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법률에 특별한 규정이 있거나 법적 의무를 준수하기 위해 필요한 경우</li>
            <li>공공기관이 법령에 정해진 소관 업무를 수행하기 위해 필요한 경우</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">5. 이용자 및 법정대리인의 권리와 행사 방법</h2>
          <p className="mb-6 text-gray-700">
            이용자 및 법정대리인은 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 
            당사의 개인정보 처리에 동의하지 않는 경우 동의를 철회하거나 가입 해지를 요청할 수 있습니다.
          </p>
          <p className="mb-6 text-gray-700">
            이용자의 개인정보 조회, 수정, 삭제, 처리정지 요구 등의 권리 행사는 
            서면, 전화, 이메일 등을 통해 하실 수 있으며, 당사는 이에 대해 지체 없이 조치하겠습니다.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">6. 개인정보의 안전성 확보 조치</h2>
          <p className="mb-6 text-gray-700">
            당사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>관리적 조치: 내부관리계획 수립 및 시행, 정기적 직원 교육</li>
            <li>기술적 조치: 개인정보 암호화, 접속기록 보관, 보안프로그램 설치</li>
            <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">7. 개인정보 보호책임자 및 연락처</h2>
          <p className="mb-6 text-gray-700">
            개인정보 보호책임자: 최근민 <br />
            이메일: kunmin.choi@gmail.com<br />
            전화번호: 010-3747-0086
          </p>
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
} 