'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { extractDateFromFilename } from '@/lib/utils';

export default function CustomerDataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const router = useRouter();

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // 파일 타입 검증
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        setError('Excel 또는 CSV 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 검증 (10MB 제한)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      
      // 파일명에서 날짜 추출 검증
      const date = extractDateFromFilename(selectedFile.name);
      if (!date) {
        setError('파일명에 YYYY-MM-DD 형식의 날짜가 포함되어야 합니다. 예: 고객데이터_2023-05-31.xlsx');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  // 파일 업로드 핸들러
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    setResult(null);
    
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      
      // API 호출
      const response = await fetch('/api/admin/monthly-report/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '업로드 중 오류가 발생했습니다.');
      }
      
      setSuccess(`${result.message}`);
      setResult(result.data);
      setFile(null);
      
    } catch (error: any) {
      console.error('업로드 오류:', error);
      setError(error.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">고객 데이터 관리</h1>
      
      {/* 업로드 폼 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">고객 데이터 업로드</h2>
        
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
              파일명에 날짜(YYYY-MM-DD)를 포함해주세요. 예: 고객데이터_2023-05-31.xlsx
            </p>
            <p className="mt-1 text-sm text-gray-500">
              파일에는 다음 컬럼이 포함되어야 합니다: 계약자명, 이메일, 전화번호, 계약번호, 대표MP, 전일잔고
            </p>
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
      {result && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">업로드 결과</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    고객명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계좌번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    포트폴리오
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    잔고
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.slice(0, 10).map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.account.account_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.account.portfolio_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Number(item.balance.balance))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {result.length > 10 && (
              <p className="mt-4 text-sm text-gray-500">
                총 {result.length}개의 데이터 중 10개만 표시됩니다.
              </p>
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
            <li><strong>계약번호</strong>: 고객의 계좌번호</li>
            <li><strong>대표MP</strong>: 포트폴리오 유형</li>
            <li><strong>전일잔고</strong>: 말일 기준 계좌 잔고</li>
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
          
          <h3>파일명 규칙</h3>
          <p>파일명에 YYYY-MM-DD 형식의 날짜를 포함해야 합니다. 예: 고객데이터_2023-05-31.xlsx</p>
          
          <h3>데이터 처리 방식</h3>
          <p>
            이메일 주소를 기준으로 고객을 식별합니다. 이미 존재하는 고객의 경우 정보가 업데이트되고,
            새로운 고객의 경우 새 계정이 생성됩니다. 계좌번호를 기준으로 계좌를 식별하며,
            업로드된 날짜를 기준으로 잔고 기록이 생성됩니다.
          </p>
        </div>
      </div>
    </div>
  );
} 