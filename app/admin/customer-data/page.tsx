'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerDataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>(new Date().getMonth() + 1 < 10 ? 
    `0${new Date().getMonth() + 1}` : 
    (new Date().getMonth() + 1).toString());
  const [dbUpdating, setDbUpdating] = useState(false);
  const [dbUpdateResult, setDbUpdateResult] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const router = useRouter();

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // 파일 업로드 핸들러
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
  
    setUploading(true);
    setError(null);
    setSuccess(null);
    setResult(null);
    setUploadResult(null);
  
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', year);
      formData.append('month', month);
      
      // API 호출
      const response = await fetch('/api/admin/customer-data/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '파일 업로드 중 오류가 발생했습니다.');
      }
      
      const data = await response.json();
      setUploadResult(data);
      setResult(data.data); // 기존 코드와의 호환성
      setSuccess(data.message || '파일이 성공적으로 업로드되었습니다.');
      console.log('업로드 결과:', data);
      
    } catch (error: any) {
      console.error('업로드 오류:', error);
      setError(error.message || '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setUploadResult(null);

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', year);
      formData.append('month', month);
      
      // API 호출 - customer-data/upload로 변경
      const response = await fetch('/api/admin/customer-data/upload', {
        method: 'POST',
        body: formData,
      });
      
      const res = await response;
      
      if (!res.ok) {
        throw new Error(await res.text() || '업로드 중 오류가 발생했습니다.');
      }
      
      const data = await res.json();
      setUploadResult(data);
      console.log('업로드 결과:', data);
      
    } catch (error: any) {
      console.error('업로드 오류:', error);
      setError(error.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">고객 데이터 관리</h1>
      
      {/* 업로드 폼 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">고객 데이터 업로드</h2>
        
        <div className="p-4 mb-4 bg-blue-50 text-blue-700 rounded-md">
          <p className="font-medium">중요 안내</p>
          <ul className="list-disc ml-5 mt-2 text-sm">
            <li>고객 데이터 업로드는 <strong>users</strong>, <strong>accounts</strong>, <strong>portfolio_types</strong>, <strong>balance_records</strong> 테이블에 데이터를 업데이트합니다.</li>
            <li>선택한 연도와 월이 잔고 기록의 <strong>year_month</strong> 값으로 사용됩니다 (예: "2023-05").</li>
            <li>포트폴리오 타입(대표MP)은 <strong>portfolio_types</strong> 테이블에 먼저 저장되고, 해당 ID가 계좌 정보에 연결됩니다.</li>
            <li>추후 월간리포트의 잔고현황 그래프에 표시될 데이터이므로 정확한 연월을 선택해주세요.</li>
          </ul>
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-md">
            {success}
          </div>
        )}
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              고객 데이터 파일 (Excel/CSV)
            </label>
            <input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              파일에는 다음 컬럼이 포함되어야 합니다: 계약자명, 이메일, 전화번호, 계약번호(D열), 계좌번호(F열), 대표MP, 전일잔고(Q열), 계약일(A열)
            </p>
          </div>
          
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                연도
              </label>
              <input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                required
                min="2000"
                max="2100"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                월
              </label>
              <input
                id="month"
                type="number"
                value={month}
                onChange={(e) => setMonth(e.target.value.padStart(2, '0'))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                required
                min="1"
                max="12"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </form>
      </div>
      
      {/* 업로드 결과 */}
      {uploadResult && (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
          <h2 className="text-xl font-semibold mb-4">업로드 결과</h2>
          
          <div className={`p-4 rounded mb-6 ${uploadResult.success ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-yellow-100 border border-yellow-400 text-yellow-700'}`}>
            <h3 className="font-bold mb-2">처리 결과</h3>
            <p>{uploadResult.message}</p>
            
            {uploadResult.data?.stats && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">처리 통계</h4>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="bg-blue-50 p-3 rounded-md flex-1">
                    <span className="text-sm text-blue-600">총 처리 데이터</span>
                    <p className="text-2xl font-bold">{uploadResult.data.stats.total_processed}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md flex-1">
                    <span className="text-sm text-green-600">사용자 업데이트</span>
                    <p className="text-2xl font-bold">{uploadResult.data.stats.users_updated}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-md flex-1">
                    <span className="text-sm text-purple-600">계좌 업데이트</span>
                    <p className="text-2xl font-bold">{uploadResult.data.stats.accounts_updated}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-md flex-1">
                    <span className="text-sm text-amber-600">잔고 레코드 업데이트</span>
                    <p className="text-2xl font-bold">{uploadResult.data.stats.balance_records_updated}</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-md flex-1">
                    <span className="text-sm text-indigo-600">포트폴리오 타입 업데이트</span>
                    <p className="text-2xl font-bold">{uploadResult.data.stats.portfolio_types_updated}</p>
                  </div>
                </div>
              </div>
            )}
            
            {uploadResult.data?.detailed_stats && (
              <div className="mt-4">
                <button 
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showDebugInfo ? '상세 정보 숨기기' : '상세 정보 보기'}
                </button>
                
                {showDebugInfo && (
                  <div className="mt-2 p-3 bg-gray-100 rounded text-sm">
                    <h4 className="font-semibold mb-2">계좌 처리</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>생성: {uploadResult.data.detailed_stats.accounts.created}개</li>
                      <li>업데이트: {uploadResult.data.detailed_stats.accounts.updated}개</li>
                      <li>오류: {uploadResult.data.detailed_stats.accounts.errors}개</li>
                    </ul>
                    
                    <h4 className="font-semibold mb-2 mt-3">잔고 레코드 처리</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>생성/업데이트: {uploadResult.data.detailed_stats.balances.created}개</li>
                      <li>0값 데이터: {uploadResult.data.detailed_stats.balances.zero_values}개</li>
                      <li>오류: {uploadResult.data.detailed_stats.balances.errors}개</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 데이터 업로드 가이드 */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h2 className="text-xl font-semibold mb-4">데이터 업로드 가이드</h2>
        
        <div className="prose max-w-none">
          <h3>필수 컬럼</h3>
          <ul>
            <li><strong>계약자명</strong>: 고객의 이름</li>
            <li><strong>이메일</strong>: 고객의 이메일 주소 (로그인 식별자로 사용)</li>
            <li><strong>전화번호</strong>: 고객의 연락처</li>
            <li><strong>계약번호(D열)</strong>: 증권번호</li>
            <li><strong>계좌번호(F열)</strong>: 실제 계좌번호 (계좌번호가 없으면 계약번호가 사용됨)</li>
            <li><strong>대표MP</strong>: 포트폴리오 유형 (<strong>portfolio_types</strong> 테이블에 저장됨)</li>
            <li><strong>전일잔고(Q열)</strong>: 말일 기준 계좌 잔고</li>
            <li><strong>계약일(A열)</strong>: 계약 날짜</li>
          </ul>
          
          <h3>추가 컬럼 (선택사항)</h3>
          <ul>
            <li><strong>고객번호</strong>: 고객 식별 번호</li>
            <li><strong>주민번호</strong>: 고객 주민등록번호</li>
            <li><strong>주소</strong>: 고객 주소</li>
            <li><strong>계약유형</strong>: 계약 종류</li>
            <li><strong>계약상태</strong>: 계약 상태</li>
            <li><strong>계약금액</strong>: 초기 계약 금액</li>
          </ul>
          
          <h3>파일 형식</h3>
          <p>Excel(.xlsx, .xls) 또는 CSV(.csv) 파일만 지원합니다.</p>
          
          <h3>데이터 처리 방식</h3>
          <p>
            이메일 주소를 기준으로 고객을 식별합니다. 이미 존재하는 고객의 경우 정보가 업데이트되고,
            새로운 고객의 경우 새 계정이 생성됩니다. 계좌번호를 기준으로 계좌를 식별하며,
            지정한 연도와 월을 기준으로 잔고 기록이 생성됩니다.
          </p>
        </div>
      </div>
    </div>
  );
} 