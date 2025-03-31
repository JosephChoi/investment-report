import Link from 'next/link';

export default function Terms() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">이용약관</h1>
          <p className="text-gray-500">최종 업데이트: 2024년 6월 1일</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">1. 약관의 목적</h2>
          <p className="mb-6 text-gray-700">
            이 약관은 투자자문 고객관리 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항, 
            기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">2. 용어의 정의</h2>
          <p className="mb-6 text-gray-700">
            이 약관에서 사용하는 용어의 정의는 다음과 같습니다:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>"서비스"란 회사가 제공하는 투자자문 고객관리 서비스를 의미합니다.</li>
            <li>"회원"이란 서비스에 가입하여 이용하는 자를 의미합니다.</li>
            <li>"아이디(ID)"란 회원의 식별과 서비스 이용을 위하여 회원이 설정하고 회사가 승인하는 문자와 숫자의 조합을 의미합니다.</li>
            <li>"비밀번호"란 회원이 설정한 아이디와 일치된 회원임을 확인하고, 회원의 개인정보를 보호하기 위해 회원 자신이 설정한 문자와 숫자의 조합을 의미합니다.</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">3. 서비스의 제공 및 변경</h2>
          <p className="mb-6 text-gray-700">
            회사는 다음과 같은 서비스를 제공합니다:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>본인계좌 정보 제공</li>
            <li>월간리포트 제공</li>
            <li>리밸런싱 알림 서비스</li>
            <li>관리자 상담내역 관리</li>
            <li>공지사항 제공</li>
            <li>연체관리 서비스</li>
          </ul>
          <p className="mb-6 text-gray-700">
            회사는 서비스의 품질 향상 및 기술적 필요에 따라 서비스의 내용을 변경할 수 있으며, 
            이 경우 변경된 서비스의 내용과 제공일자를 명시하여 현행 약관과 함께 서비스 내에 공지합니다.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">4. 서비스 이용계약의 성립</h2>
          <p className="mb-6 text-gray-700">
            서비스 이용계약은 회원이 되고자 하는 자(이하 "가입신청자")가 약관의 내용에 대하여 동의를 한 다음 
            회원가입 신청을 하고, 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.
          </p>
          <p className="mb-6 text-gray-700">
            회사는 가입신청자의 신청에 대하여 서비스 이용을 승낙합니다. 
            다만, 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나, 사후에 이용계약을 해지할 수 있습니다:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
            <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
            <li>허위의 정보를 기재하거나, 회사가 요구하는 정보를 제공하지 않은 경우</li>
            <li>가입신청자가 만 14세 미만인 경우</li>
            <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">5. 회원의 의무</h2>
          <p className="mb-6 text-gray-700">
            회원은 다음 각 호의 행위를 하여서는 안 됩니다:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>신청 또는 변경 시 허위 내용의 등록</li>
            <li>타인의 정보 도용</li>
            <li>회사가 게시한 정보의 변경</li>
            <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
            <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
            <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
            <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
            <li>기타 불법적이거나 부당한 행위</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">6. 회사의 의무</h2>
          <p className="mb-6 text-gray-700">
            회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 이 약관이 정하는 바에 따라 
            지속적이고, 안정적으로 서비스를 제공하는데 최선을 다하여야 합니다.
          </p>
          <p className="mb-6 text-gray-700">
            회사는 회원이 안전하게 서비스를 이용할 수 있도록 회원의 개인정보(신용정보 포함)보호를 위한 
            보안 시스템을 갖추어야 합니다.
          </p>
          <p className="mb-6 text-gray-700">
            회사는 서비스이용과 관련하여 회원으로부터 제기된 의견이나 불만이 정당하다고 인정할 경우에는 
            이를 처리하여야 합니다. 회원이 제기한 의견이나 불만사항에 대해서는 게시판을 활용하거나 
            전자우편 등을 통하여 회원에게 처리과정 및 결과를 전달합니다.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">7. 분쟁해결</h2>
          <p className="mb-6 text-gray-700">
            회사는 회원으로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다. 
            다만, 신속한 처리가 곤란한 경우에는 회원에게 그 사유와 처리일정을 통보해 드립니다.
          </p>
          <p className="mb-6 text-gray-700">
            회사와 회원 간에 발생한 전자상거래 분쟁과 관련하여 회원의 피해구제신청이 있는 경우에는 
            공정거래위원회 또는 시/도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">8. 약관의 개정</h2>
          <p className="mb-6 text-gray-700">
            회사는 필요한 경우 약관을 개정할 수 있으며, 약관을 개정할 경우에는 적용일자 및 개정사유를 
            명시하여 현행 약관과 함께 서비스의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.
          </p>
          <p className="mb-6 text-gray-700">
            회원이 개정약관의 적용에 동의하지 않는 경우 회사는 개정 약관의 내용을 적용할 수 없으며, 
            이 경우 회원은 이용계약을 해지할 수 있습니다. 다만, 기존 약관을 적용할 수 없는 특별한 사정이 있는 경우에는 
            회사는 이용계약을 해지할 수 있습니다.
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