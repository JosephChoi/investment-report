import Link from 'next/link';

export default function CookiePolicy() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">쿠키 정책</h1>
          <p className="text-gray-500">최종 업데이트: 2024년 6월 1일</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">1. 쿠키란 무엇인가요?</h2>
          <p className="mb-6 text-gray-700">
            쿠키는 웹사이트가 사용자의 컴퓨터나 모바일 기기에 저장하는 작은 텍스트 파일입니다. 
            쿠키는 웹사이트가 사용자의 기기를 인식하고 사용자 경험을 향상시키는 데 도움을 줍니다. 
            쿠키는 사용자의 설정을 기억하고, 사용자에게 맞춤형 경험을 제공하며, 웹사이트의 성능을 측정하고 개선하는 데 사용됩니다.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">2. 당사가 사용하는 쿠키 유형</h2>
          <p className="mb-6 text-gray-700">
            당사는 다음과 같은 유형의 쿠키를 사용합니다:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-4">
            <li>
              <strong>필수 쿠키:</strong> 이 쿠키는 웹사이트의 기본 기능 작동에 필요합니다. 여기에는 로그인 상태 유지, 보안 유지 등이 포함됩니다. 이 쿠키는 비활성화할 수 없습니다.
            </li>
            <li>
              <strong>성능 쿠키:</strong> 이 쿠키는 사용자가 웹사이트를 어떻게 사용하는지에 대한 정보를 수집하여 웹사이트의 성능을 개선하는 데 도움을 줍니다. 이러한 쿠키는 사용자를 개인적으로 식별하지 않습니다.
            </li>
            <li>
              <strong>기능 쿠키:</strong> 이 쿠키는 사용자의 설정과 선호도를 기억하여 웹사이트가 사용자에게 더 나은 경험을 제공할 수 있도록 합니다.
            </li>
            <li>
              <strong>타겟팅/광고 쿠키:</strong> 이 쿠키는 사용자의 관심사에 맞는 광고를 표시하기 위해 사용됩니다. 이러한 쿠키는 사용자의 브라우징 활동을 추적하고 사용자가 관심을 가질 만한 광고를 표시합니다.
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">3. 당사가 사용하는 특정 쿠키</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left">쿠키 이름</th>
                  <th className="py-3 px-4 border-b text-left">유형</th>
                  <th className="py-3 px-4 border-b text-left">목적</th>
                  <th className="py-3 px-4 border-b text-left">만료 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-4 border-b">session_id</td>
                  <td className="py-3 px-4 border-b">필수</td>
                  <td className="py-3 px-4 border-b">사용자 세션을 식별하고 로그인 상태를 유지합니다.</td>
                  <td className="py-3 px-4 border-b">세션 종료 시</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 border-b">auth_token</td>
                  <td className="py-3 px-4 border-b">필수</td>
                  <td className="py-3 px-4 border-b">사용자 인증에 사용됩니다.</td>
                  <td className="py-3 px-4 border-b">14일</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 border-b">_ga</td>
                  <td className="py-3 px-4 border-b">성능</td>
                  <td className="py-3 px-4 border-b">Google Analytics에서 사용자를 구분하기 위해 사용됩니다.</td>
                  <td className="py-3 px-4 border-b">2년</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 border-b">_gid</td>
                  <td className="py-3 px-4 border-b">성능</td>
                  <td className="py-3 px-4 border-b">Google Analytics에서 사용자를 구분하기 위해 사용됩니다.</td>
                  <td className="py-3 px-4 border-b">24시간</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 border-b">user_preferences</td>
                  <td className="py-3 px-4 border-b">기능</td>
                  <td className="py-3 px-4 border-b">사용자의 웹사이트 설정을 저장합니다.</td>
                  <td className="py-3 px-4 border-b">1년</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">4. 쿠키 관리 방법</h2>
          <p className="mb-6 text-gray-700">
            대부분의 웹 브라우저는 쿠키를 허용하도록 기본 설정되어 있습니다. 그러나 사용자는 브라우저 설정을 변경하여 
            쿠키를 거부하거나 삭제할 수 있습니다. 브라우저 설정 변경 방법은 브라우저마다 다르므로, 
            사용 중인 브라우저의 도움말을 참조하시기 바랍니다.
          </p>
          <p className="mb-6 text-gray-700">
            쿠키를 비활성화하면 웹사이트의 특정 기능이 제대로 작동하지 않을 수 있습니다.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">5. 제3자 쿠키</h2>
          <p className="mb-6 text-gray-700">
            당사 웹사이트는 제3자가 제공하는 서비스 및 기능을 사용할 수 있으며, 이러한 제3자는 자체 쿠키를 설정할 수 있습니다. 
            당사는 이러한 제3자 쿠키에 대한 직접적인 제어권이 없으며, 제3자의 개인정보 처리방침을 참조하시는 것이 좋습니다. 
            당사가 사용하는 주요 제3자 서비스는 다음과 같습니다:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>Google Analytics (분석)</li>
            <li>Facebook (소셜 미디어 기능)</li>
            <li>Google 광고 서비스</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">6. 쿠키 정책 변경</h2>
          <p className="mb-6 text-gray-700">
            당사는 이 쿠키 정책을 주기적으로 검토하고 업데이트할 수 있습니다. 
            정책이 변경될 경우, 변경된 정책을 웹사이트에 게시하고 필요한 경우 사용자에게 통지합니다.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">7. 연락처</h2>
          <p className="mb-6 text-gray-700">
            이 쿠키 정책과 관련하여 질문이나 의견이 있으시면 다음 연락처로 문의해 주시기 바랍니다:
          </p>
          <p className="mb-6 text-gray-700">
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