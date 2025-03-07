'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Save } from 'lucide-react';

export default function MonthlyReportAdmin() {
  const [customerFile, setCustomerFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [monthlyComment, setMonthlyComment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // 파일 업로드 핸들러
  const handleCustomerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomerFile(e.target.files[0]);
    }
  };
  
  const handlePortfolioFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPortfolioFiles(Array.from(e.target.files));
    }
  };
  
  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제 구현에서는 Supabase 또는 API를 통해 데이터를 저장
    alert('데이터가 저장되었습니다.');
  };
  
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-gray-700 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>관리자 페이지로 돌아가기</span>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2 text-gray-900">월간리포트 관리</h1>
      <p className="text-gray-600 mb-8">월별 고객 리스트, 포트폴리오 자료, 월간 코멘트를 관리합니다.</p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 월 선택 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">월 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                월 선택
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                required
              >
                <option value="">월을 선택하세요</option>
                <option value="2024-01">2024년 1월</option>
                <option value="2024-02">2024년 2월</option>
                <option value="2024-03">2024년 3월</option>
                <option value="2024-04">2024년 4월</option>
                <option value="2024-05">2024년 5월</option>
                <option value="2024-06">2024년 6월</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* 월별 전체 고객 리스트 업로드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">월별 전체 고객 리스트 업로드</h2>
          <p className="text-gray-600 text-sm mb-4">잔고 현황이 포함된 엑셀 데이터를 업로드하세요.</p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="customerFile"
              accept=".xlsx,.xls,.csv"
              onChange={handleCustomerFileChange}
              className="hidden"
            />
            <label
              htmlFor="customerFile"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-gray-600 mb-1">
                {customerFile ? customerFile.name : '파일을 선택하거나 여기에 드래그하세요'}
              </span>
              <span className="text-xs text-gray-500">
                지원 형식: Excel(.xlsx, .xls), CSV(.csv)
              </span>
            </label>
          </div>
          
          {customerFile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{customerFile.name}</span>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setCustomerFile(null)}
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* 포트폴리오 자료 업로드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">포트폴리오 자료 업로드</h2>
          <p className="text-gray-600 text-sm mb-4">월간 포트폴리오 자료(JPG)를 업로드하세요.</p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="portfolioFiles"
              accept=".jpg,.jpeg,.png"
              multiple
              onChange={handlePortfolioFilesChange}
              className="hidden"
            />
            <label
              htmlFor="portfolioFiles"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-gray-600 mb-1">
                {portfolioFiles.length > 0
                  ? `${portfolioFiles.length}개의 파일이 선택됨`
                  : '파일을 선택하거나 여기에 드래그하세요'}
              </span>
              <span className="text-xs text-gray-500">
                지원 형식: JPG(.jpg, .jpeg), PNG(.png)
              </span>
            </label>
          </div>
          
          {portfolioFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {portfolioFiles.map((file, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        const newFiles = [...portfolioFiles];
                        newFiles.splice(index, 1);
                        setPortfolioFiles(newFiles);
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 공통 Monthly Comment 작성 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">공통 Monthly Comment 작성</h2>
          <p className="text-gray-600 text-sm mb-4">모든 고객에게 표시될 월간 코멘트를 작성하세요.</p>
          
          <div>
            <label htmlFor="monthlyComment" className="block text-sm font-medium text-gray-700 mb-1">
              월간 코멘트
            </label>
            <textarea
              id="monthlyComment"
              rows={6}
              value={monthlyComment}
              onChange={(e) => setMonthlyComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
              placeholder="이번 달의 투자 코멘트를 작성하세요..."
              required
            ></textarea>
          </div>
        </div>
        
        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Save className="w-4 h-4 mr-2" />
            저장하기
          </button>
        </div>
      </form>
    </div>
  );
} 