'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default function MonthlyReportAdmin() {
  const [customerFile, setCustomerFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [monthlyComment, setMonthlyComment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMonth) {
      setError('월을 선택해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Supabase 테이블 구조 확인
      console.log('Supabase 테이블 구조 확인 중...');
      
      // 각 테이블의 구조 확인
      try {
        const { data: monthlyCommentsColumns, error: monthlyCommentsError } = await supabase
          .from('monthly_comments')
          .select('*')
          .limit(1);
          
        console.log('monthly_comments 테이블 구조:', monthlyCommentsColumns);
        
        const { data: portfolioReportsColumns, error: portfolioReportsError } = await supabase
          .from('portfolio_reports')
          .select('*')
          .limit(1);
          
        console.log('portfolio_reports 테이블 구조:', portfolioReportsColumns);
        
        const { data: monthlyReportsColumns, error: monthlyReportsError } = await supabase
          .from('monthly_reports')
          .select('*')
          .limit(1);
          
        console.log('monthly_reports 테이블 구조:', monthlyReportsColumns);
        
        // 테이블 목록 가져오기
        const { data: tables, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
          
        if (tablesError) {
          console.error('테이블 목록 가져오기 오류:', tablesError);
        } else {
          console.log('사용 가능한 테이블:', tables);
        }
      } catch (error) {
        console.error('테이블 구조 확인 중 오류:', error);
      }
      
      // 선택한 월에서 연도와 월 추출
      const [year, month] = selectedMonth.split('-');
      
      // 1. 월간 코멘트 저장
      if (monthlyComment) {
        try {
          // Supabase 테이블 구조 확인
          console.log('월간 코멘트 저장 시도:', {
            year_month: selectedMonth,
            content: monthlyComment,
            comment_date: new Date().toISOString()
          });
          
          const { data: commentData, error: commentError } = await supabase
            .from('monthly_comments')
            .upsert({
              year_month: selectedMonth,  // 'year'와 'month' 대신 'year_month' 사용
              content: monthlyComment,
              comment_date: new Date().toISOString()
            })
            .select();
            
          if (commentError) {
            console.error('월간 코멘트 저장 오류 상세:', commentError);
            throw new Error(`월간 코멘트 저장 오류: ${commentError.message}`);
          }
          
          console.log('월간 코멘트 저장 성공:', commentData);
        } catch (commentError: any) {
          console.error('월간 코멘트 저장 중 오류:', commentError);
          setError(`월간 코멘트 저장 중 오류: ${commentError.message}`);
          // 월간 코멘트 저장 실패해도 계속 진행
        }
      }
      
      // 2. 고객 데이터 파일 업로드 (실제로는 API를 통해 처리)
      if (customerFile) {
        try {
          const formData = new FormData();
          formData.append('file', customerFile);
          formData.append('year', year);
          formData.append('month', month);
          
          console.log('고객 데이터 업로드 시도:', {
            file: customerFile.name,
            year,
            month
          });
          
          const response = await fetch('/api/admin/customer-data/upload', {
            method: 'POST',
            body: formData
          });
          
          const responseText = await response.text();
          console.log('API 응답 텍스트:', responseText);
          
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (e) {
            console.error('JSON 파싱 오류:', e);
            throw new Error(`API 응답을 파싱할 수 없습니다: ${responseText}`);
          }
          
          if (!response.ok) {
            console.error('고객 데이터 업로드 응답:', result);
            throw new Error(`고객 데이터 업로드 오류: ${result.error || '알 수 없는 오류'}`);
          }
          
          console.log('고객 데이터 업로드 결과:', result);
        } catch (uploadError: any) {
          console.error('고객 데이터 업로드 중 오류:', uploadError);
          setError(`고객 데이터 업로드 중 오류: ${uploadError.message}`);
          // 고객 데이터 업로드 실패해도 계속 진행
        }
      }
      
      // 3. 포트폴리오 파일 업로드
      if (portfolioFiles.length > 0) {
        for (const file of portfolioFiles) {
          try {
            // 파일 이름에서 공백과 특수 문자 제거
            const safeFileName = file.name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
            
            // 파일 경로 생성
            const filePath = `portfolio-reports/${year}/${month}/${safeFileName}`;
            
            console.log('파일 업로드 경로:', filePath);
            
            // Storage에 파일 업로드
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('portfolio-reports')
              .upload(filePath, file, {
                upsert: true // 같은 이름의 파일이 있으면 덮어쓰기
              });
              
            if (uploadError) {
              console.error('파일 업로드 오류 상세:', uploadError);
              throw new Error(`포트폴리오 파일 업로드 오류: ${uploadError.message}`);
            }
            
            console.log('파일 업로드 성공:', uploadData);
            
            // 파일 URL 가져오기
            const { data: urlData } = supabase.storage
              .from('portfolio-reports')
              .getPublicUrl(filePath);
              
            if (!urlData || !urlData.publicUrl) {
              throw new Error('파일 URL을 가져올 수 없습니다.');
            }
            
            console.log('파일 URL:', urlData.publicUrl);
            
            // 원본 파일 이름에서 확장자 제거 (포트폴리오 유형으로 사용)
            const portfolioType = file.name.replace(/\.[^/.]+$/, '');
              
            // 포트폴리오 리포트 정보 저장
            console.log('포트폴리오 리포트 저장 시도:', {
              year_month: selectedMonth,
              portfolio_type: portfolioType,
              report_url: urlData.publicUrl,
              report_date: new Date().toISOString()
            });
            
            const { data: reportData, error: reportError } = await supabase
              .from('portfolio_reports')
              .insert({
                year_month: selectedMonth,
                portfolio_type: portfolioType,
                report_url: urlData.publicUrl,
                report_date: new Date().toISOString()
              })
              .select();
              
            if (reportError) {
              console.error('포트폴리오 리포트 정보 저장 오류 상세:', reportError);
              throw new Error(`포트폴리오 리포트 정보 저장 오류: ${reportError.message}`);
            }
            
            console.log('포트폴리오 리포트 저장 성공:', reportData);
          } catch (fileError: any) {
            console.error('파일 처리 중 오류:', fileError);
            setError(`파일 '${file.name}' 처리 중 오류: ${fileError.message}`);
            // 하나의 파일에서 오류가 발생해도 다른 파일은 계속 처리
          }
        }
      }
      
      // 4. 월간 리포트 정보 저장
      try {
        console.log('월간 리포트 정보 저장 시도:', {
          year_month: selectedMonth,
          title: `${year}년 ${month}월 투자 리포트`,
          description: '월간 투자 현황 및 포트폴리오 리포트입니다.'
        });
        
        const { data: reportData, error: monthlyReportError } = await supabase
          .from('monthly_reports')
          .upsert({
            year_month: selectedMonth,
            title: `${year}년 ${month}월 투자 리포트`,
            description: '월간 투자 현황 및 포트폴리오 리포트입니다.'
          })
          .select();
          
        if (monthlyReportError) {
          console.error('월간 리포트 정보 저장 오류 상세:', monthlyReportError);
          throw new Error(`월간 리포트 정보 저장 오류: ${monthlyReportError.message}`);
        }
        
        console.log('월간 리포트 정보 저장 성공:', reportData);
      } catch (reportError: any) {
        console.error('월간 리포트 저장 중 오류:', reportError);
        setError(`월간 리포트 저장 중 오류: ${reportError.message}`);
        // 월간 리포트 저장 실패해도 성공 메시지는 표시
      }
      
      // 성공 메시지 설정
      setSuccess('데이터가 성공적으로 저장되었습니다.');
      
      // 폼 초기화
      setMonthlyComment('');
      setCustomerFile(null);
      setPortfolioFiles([]);
      
    } catch (error: any) {
      console.error('데이터 저장 오류:', error);
      setError(error.message || '데이터 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-black"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-black"
              placeholder="이번 달의 투자 코멘트를 작성하세요..."
              required
            ></textarea>
          </div>
        </div>
        
        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                저장하기
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 