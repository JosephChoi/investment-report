'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Save, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';

export default function MonthlyReportAdmin() {
  const [customerFile, setCustomerFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [monthlyComment, setMonthlyComment] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customerFileWarning, setCustomerFileWarning] = useState<string | null>(null);
  const [portfolioFileWarnings, setPortfolioFileWarnings] = useState<{[key: string]: string}>({});
  const [portfolioTypes, setPortfolioTypes] = useState<string[]>([]);
  const [portfolioTypeMappings, setPortfolioTypeMappings] = useState<{[key: string]: string}>({});
  const [loadingPortfolioTypes, setLoadingPortfolioTypes] = useState(false);
  
  // 현재 날짜 기준으로 초기 선택 날짜 설정
  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    
    // 포트폴리오 타입 목록 가져오기
    fetchPortfolioTypes();
  }, []);

  // 포트폴리오 타입 목록 가져오기
  const fetchPortfolioTypes = async () => {
    try {
      setLoadingPortfolioTypes(true);
      const response = await fetch('/api/admin/portfolio-types');
      const result = await response.json();
      
      if (result.success && result.data) {
        setPortfolioTypes(result.data);
      } else {
        console.error('포트폴리오 타입 목록 가져오기 오류:', result.error);
      }
    } catch (error) {
      console.error('포트폴리오 타입 목록 가져오기 중 오류:', error);
    } finally {
      setLoadingPortfolioTypes(false);
    }
  };

  // 날짜 선택 시 selectedMonth 업데이트
  useEffect(() => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      // getMonth()는 0부터 시작하므로 1을 더해줍니다.
      const month = selectedDate.getMonth() + 1;
      // YYYY-MM 형식으로 변환
      setSelectedMonth(`${year}-${month.toString().padStart(2, '0')}`);
    }
  }, [selectedDate]);
  
  // 파일명에서 날짜 추출하는 함수
  const extractDateFromFilename = (filename: string): Date | null => {
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch && dateMatch[1]) {
      return new Date(dateMatch[1]);
    }
    return null;
  };
  
  // 날짜 선택 핸들러
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    // 선택 시 성공/에러 메시지 초기화
    setSuccess(null);
    setError(null);
  };
  
  // 파일 업로드 핸들러
  const handleCustomerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomerFile(file);
      
      // 파일명에서 날짜 확인
      const date = extractDateFromFilename(file.name);
      if (!date) {
        setCustomerFileWarning('파일명에 YYYY-MM-DD 형식의 날짜가 포함되어 있지 않습니다. 업로드 시 오류가 발생할 수 있습니다.');
      } else {
        setCustomerFileWarning(null);
      }
      
      // 파일 선택 시 성공/에러 메시지 초기화
      setSuccess(null);
      setError(null);
    }
  };
  
  const handlePortfolioFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // 기존 파일과 새 파일을 합치기
      const combinedFiles = [...portfolioFiles];
      const fileNames = new Set(combinedFiles.map(file => file.name));
      
      // 중복 파일 확인 및 추가
      newFiles.forEach(file => {
        if (!fileNames.has(file.name)) {
          combinedFiles.push(file);
          fileNames.add(file.name);
        }
      });
      
      // 최대 20개 파일로 제한
      const limitedFiles = combinedFiles.slice(0, 20);
      
      // 파일 개수 제한 경고
      if (combinedFiles.length > 20) {
        setError(`최대 20개의 파일만 업로드할 수 있습니다. ${combinedFiles.length - 20}개의 파일이 제외되었습니다.`);
        setTimeout(() => setError(null), 5000); // 5초 후 에러 메시지 자동 제거
      }
      
      setPortfolioFiles(limitedFiles);
      
      // 파일명 확인
      const warnings: {[key: string]: string} = {...portfolioFileWarnings};
      const newMappings = {...portfolioTypeMappings};
      
      limitedFiles.forEach(file => {
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // 확장자 제거
        
        // 파일명에 공백이나 특수문자가 있는 경우 경고
        if (fileName.includes(' ') || /[^\w가-힣]/.test(fileName)) {
          warnings[file.name] = '파일명에 공백이나 특수문자가 포함되어 있습니다. 포트폴리오 타입 매핑이 필요합니다.';
        }
        
        // 기존 매핑이 없는 경우 기본값 설정
        if (!newMappings[file.name] && portfolioTypes.length > 0) {
          // 파일명과 가장 유사한 포트폴리오 타입 찾기
          const cleanFileName = fileName.replace(/[^\w가-힣]/g, '').toLowerCase();
          let bestMatch = portfolioTypes[0];
          let bestMatchScore = 0;
          
          portfolioTypes.forEach(type => {
            const cleanType = type.replace(/\s+/g, '').toLowerCase();
            let score = 0;
            
            // 간단한 유사도 계산 (포함 관계 확인)
            if (cleanType.includes(cleanFileName) || cleanFileName.includes(cleanType)) {
              score = Math.min(cleanType.length, cleanFileName.length);
            }
            
            if (score > bestMatchScore) {
              bestMatchScore = score;
              bestMatch = type;
            }
          });
          
          newMappings[file.name] = bestMatch;
        }
      });
      
      setPortfolioFileWarnings(warnings);
      setPortfolioTypeMappings(newMappings);
      
      // 파일 선택 시 성공/에러 메시지 초기화
      setSuccess(null);
      
      // 파일 입력 필드 초기화 (동일한 파일을 다시 선택할 수 있도록)
      e.target.value = '';
    }
  };
  
  // 포트폴리오 타입 매핑 변경 핸들러
  const handlePortfolioTypeMappingChange = (fileName: string, portfolioType: string) => {
    setPortfolioTypeMappings(prev => ({
      ...prev,
      [fileName]: portfolioType
    }));
  };
  
  // 월간 코멘트 변경 핸들러
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMonthlyComment(e.target.value);
    // 입력 시 성공/에러 메시지 초기화
    setSuccess(null);
    setError(null);
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 월 선택 확인
    if (!selectedMonth) {
      setError('월을 선택해주세요.');
      return;
    }
    
    // 파일명 유효성 검사
    if (customerFile) {
      const date = extractDateFromFilename(customerFile.name);
      if (!date) {
        setError('고객 데이터 파일명에 YYYY-MM-DD 형식의 날짜가 포함되어 있지 않습니다. 파일명을 수정하고 다시 시도해주세요.');
        return;
      }
    }
    
    // 포트폴리오 파일 매핑 유효성 검사
    if (portfolioFiles.length > 0) {
      const unmappedFiles = portfolioFiles.filter(file => !portfolioTypeMappings[file.name]);
      
      if (unmappedFiles.length > 0) {
        // 자동으로 매핑 설정
        const newMappings = {...portfolioTypeMappings};
        
        unmappedFiles.forEach(file => {
          if (portfolioTypes.length > 0) {
            // 첫 번째 포트폴리오 타입으로 기본 설정
            newMappings[file.name] = portfolioTypes[0];
          }
        });
        
        setPortfolioTypeMappings(newMappings);
      }
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Supabase 테이블 구조 확인
      console.log('Supabase 테이블 구조 확인 중...');
      
      // 각 테이블의 구조 확인
      try {
        console.log('데이터 저장을 시작합니다.');
      } catch (error) {
        console.error('테이블 구조 확인 중 오류:', error);
      }
      
      // 선택한 월에서 연도와 월 추출
      const [year, month] = selectedMonth.split('-');
      
      // 1. 월간 코멘트 저장
      if (monthlyComment) {
        try {
          console.log('월간 코멘트 저장 시도:', {
            year_month: selectedMonth,
            content: monthlyComment.replace(/\n/g, '<br>'),  // 줄 바꿈을 <br> 태그로 변환
            comment_date: new Date().toISOString()
          });
          
          // API를 통해 월간 코멘트 저장
          const response = await fetch('/api/admin/monthly-comment/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              year_month: selectedMonth,
              content: monthlyComment.replace(/\n/g, '<br>'),
              comment_date: new Date().toISOString()
            })
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            console.error('월간 코멘트 저장 응답:', result);
            throw new Error(`월간 코멘트 저장 오류: ${result.error || '알 수 없는 오류'}`);
          }
          
          console.log('월간 코멘트 저장 성공:', result);
        } catch (commentError: any) {
          console.error('월간 코멘트 저장 중 오류:', commentError);
          setError(`월간 코멘트 저장 중 오류: ${commentError.message}`);
          // 오류 발생 시 성공 메시지를 표시하지 않고 함수 종료
          setLoading(false);
          return;
        }
      } else {
        console.log('월간 코멘트가 입력되지 않았습니다. 기존 코멘트를 유지합니다.');
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
          // 오류 발생 시 성공 메시지를 표시하지 않고 함수 종료
          setLoading(false);
          return;
        }
      }
      
      // 3. 포트폴리오 파일 업로드
      if (portfolioFiles.length > 0) {
        console.log('포트폴리오 파일 업로드 시작...');
        
        for (const file of portfolioFiles) {
          try {
            // 파일 유형 검증
            const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validImageTypes.includes(file.type)) {
              console.error('지원되지 않는 파일 형식:', file.type);
              setError(`파일 '${file.name}'은 지원되지 않는 형식입니다. JPG, PNG, GIF 형식만 지원합니다.`);
              setLoading(false);
              return;
            }
            
            // 파일 크기 검증 (10MB 제한)
            if (file.size > 10 * 1024 * 1024) {
              console.error('파일 크기가 너무 큽니다:', file.size);
              setError(`파일 '${file.name}'의 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.`);
              setLoading(false);
              return;
            }
            
            // 포트폴리오 타입 결정 (파일명 기반)
            const portfolioType = portfolioTypeMappings[file.name] || (portfolioTypes.length > 0 ? portfolioTypes[0] : file.name.replace(/\.[^/.]+$/, ''));
            
            // 파일 확장자 추출 및 소문자 변환
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const portfolioTypeLower = portfolioType.toLowerCase();
            
            // 파일명에서 특수 문자 및 공백 제거하는 함수
            const sanitizeFileName = (name: string) => {
              // 공백을 언더스코어로 변경하고 특수 문자 제거
              return name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
            };
            
            // 영문 파일명 생성
            let englishFileName = '';
            
            // 더 구체적인 타입을 먼저 확인 (순서 중요)
            if (portfolioTypeLower.includes('국내') && portfolioTypeLower.includes('적립식') && portfolioTypeLower.includes('etf')) {
              englishFileName = `domestic_savings_etf_${month}.${fileExt}`;
            } else if (portfolioTypeLower.includes('국내') && portfolioTypeLower.includes('etf')) {
              englishFileName = `domestic_etf_${month}.${fileExt}`;
            } else if (portfolioTypeLower.includes('연금') && portfolioTypeLower.includes('적립식')) {
              englishFileName = `pension_savings_${month}.${fileExt}`;
            } else if (portfolioTypeLower.includes('연금') || portfolioTypeLower.includes('irp')) {
              englishFileName = `pension_${month}.${fileExt}`;
            } else if (portfolioTypeLower.includes('적립식')) {
              englishFileName = `savings_${month}.${fileExt}`;
            } else if (portfolioTypeLower.includes('isa')) {
              englishFileName = `isa_${month}.${fileExt}`;
            } else if (portfolioTypeLower.includes('bdc') || portfolioTypeLower.includes('배당')) {
              englishFileName = `dividend_${month}.${fileExt}`;
            } else if (portfolioTypeLower.includes('채권')) {
              englishFileName = `bond_${month}.${fileExt}`;
            } else if (portfolioTypeLower.includes('글로벌') || portfolioTypeLower.includes('해외')) {
              englishFileName = `global_${month}.${fileExt}`;
            } else {
              // 기본값: 포트폴리오 타입을 영문화하여 사용
              englishFileName = `portfolio_${sanitizeFileName(portfolioType)}_${month}.${fileExt}`;
            }
            
            // 최종 파일명 정리 (안전한 파일명으로 변환)
            englishFileName = sanitizeFileName(englishFileName);
            
            console.log('포트폴리오 파일 업로드 시도:', {
              file: file.name,
              englishFileName,
              portfolioType,
              year_month: selectedMonth
            });
            
            // FormData 생성
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileName', englishFileName); // 영문 파일명 사용
            formData.append('portfolioType', portfolioType);
            formData.append('year_month', selectedMonth);
            formData.append('year', year);
            formData.append('month', month);
            
            // API를 통해 포트폴리오 파일 업로드
            const response = await fetch('/api/admin/portfolio-file/upload', {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
              console.error('포트폴리오 파일 업로드 응답:', result);
              
              // 오류 메시지 상세화
              let errorMessage = `파일 '${file.name}' 처리 중 오류`;
              
              if (result.error) {
                errorMessage += `: ${result.error}`;
              } else if (result.message) {
                errorMessage += `: ${result.message}`;
              } else {
                errorMessage += ': 알 수 없는 오류';
              }
              
              // 원본 오류 정보가 있으면 콘솔에 로깅
              if (result.originalError) {
                console.error('원본 오류 정보:', result.originalError);
              }
              
              throw new Error(errorMessage);
            }
            
            console.log('포트폴리오 파일 업로드 성공:', result);
          } catch (fileError: any) {
            console.error('파일 처리 중 오류:', fileError);
            setError(`파일 '${file.name}' 처리 중 오류: ${fileError.message}`);
            // 오류 발생 시 성공 메시지를 표시하지 않고 함수 종료
            setLoading(false);
            return;
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
        
        // API를 통해 월간 리포트 정보 저장
        const response = await fetch('/api/admin/monthly-report/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            year_month: selectedMonth,
            title: `${year}년 ${month}월 투자 리포트`,
            description: '월간 투자 현황 및 포트폴리오 리포트입니다.'
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          console.error('월간 리포트 정보 저장 응답:', result);
          throw new Error(`월간 리포트 정보 저장 오류: ${result.error || '알 수 없는 오류'}`);
        }
        
        console.log('월간 리포트 정보 저장 성공:', result);
      } catch (reportError: any) {
        console.error('월간 리포트 저장 중 오류:', reportError);
        setError(`월간 리포트 저장 중 오류: ${reportError.message}`);
        // 오류 발생 시 성공 메시지를 표시하지 않고 함수 종료
        setLoading(false);
        return;
      }
      
      // 성공 메시지 설정 - 모든 작업이 성공적으로 완료된 경우에만 표시
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
          <h2 className="text-xl font-semibold mb-4 text-gray-900">연도 및 월 선택</h2>
          <p className="text-gray-600 text-sm mb-4">월간리포트를 생성할 연도와 월을 선택하세요. 캘린더에서 원하는 연도와 월을 자유롭게 선택할 수 있습니다.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                연도 및 월 선택
              </label>
              <div className="relative">
                <DatePicker
                  id="date"
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="yyyy년 MM월"
                  showMonthYearPicker
                  showFullMonthYearPicker
                  locale={ko}
                  placeholderText="연도와 월을 선택하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-black pr-10"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              {selectedMonth && (
                <div className="mt-2 text-sm text-gray-600">
                  선택된 월: <span className="font-medium">{selectedMonth.split('-')[0]}년 {selectedMonth.split('-')[1]}월</span>
                  <span className="ml-2 text-blue-600">
                    (데이터 저장 형식: {selectedMonth})
                  </span>
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500">
                <p>* 캘린더에서 연도와 월만 선택할 수 있습니다.</p>
                <p>* 선택한 연도와 월에 해당하는 월간리포트가 생성됩니다.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 월별 전체 고객 리스트 업로드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">월별 전체 고객 리스트 업로드</h2>
          <p className="text-gray-600 text-sm mb-4">잔고 현황이 포함된 엑셀 데이터를 업로드하세요.</p>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-sm">
            <p className="font-medium mb-1">파일명 형식 안내</p>
            <p>파일명에 <strong>YYYY-MM-DD 형식의 날짜</strong>가 포함되어야 합니다. (예: 고객데이터_2024-05-31.xlsx)</p>
            <p>이 날짜는 데이터의 기록 날짜로 사용됩니다.</p>
          </div>
          
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
              {customerFileWarning && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                  <span className="font-medium">경고:</span> {customerFileWarning}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 포트폴리오 자료 업로드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">포트폴리오 자료 업로드</h2>
          <p className="text-gray-600 text-sm mb-4">월간 포트폴리오 자료(JPG)를 업로드하세요.</p>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-sm">
            <p className="font-medium mb-1">파일명과 포트폴리오 타입 매핑 안내</p>
            <p>업로드한 각 파일은 데이터베이스에 저장된 포트폴리오 타입과 매핑되어야 합니다.</p>
            <p>파일 업로드 후 각 파일에 대해 매핑할 포트폴리오 타입을 선택해주세요.</p>
            <p>최대 20개의 파일을 업로드할 수 있습니다.</p>
          </div>
          
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
                  ? `${portfolioFiles.length}개의 파일이 선택됨 (최대 20개)`
                  : '파일을 선택하거나 여기에 드래그하세요'}
              </span>
              <span className="text-xs text-gray-500">
                지원 형식: JPG(.jpg, .jpeg), PNG(.png)
              </span>
            </label>
          </div>
          
          {loadingPortfolioTypes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md text-center">
              <p className="text-gray-600 text-sm">포트폴리오 타입 목록을 불러오는 중...</p>
            </div>
          )}
          
          {portfolioFiles.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  선택된 파일 ({portfolioFiles.length}/20)
                </h3>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-800"
                  onClick={() => {
                    setPortfolioFiles([]);
                    setPortfolioFileWarnings({});
                    setPortfolioTypeMappings({});
                  }}
                >
                  모두 삭제
                </button>
              </div>
              <div className="space-y-2">
                {portfolioFiles.map((file, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                      <div className="flex-grow mb-2 md:mb-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            className="text-gray-500 hover:text-gray-700 md:hidden"
                            onClick={() => {
                              const newFiles = [...portfolioFiles];
                              newFiles.splice(index, 1);
                              setPortfolioFiles(newFiles);
                              
                              // 경고 메시지도 제거
                              const newWarnings = {...portfolioFileWarnings};
                              delete newWarnings[file.name];
                              setPortfolioFileWarnings(newWarnings);
                              
                              // 매핑 정보도 제거
                              const newMappings = {...portfolioTypeMappings};
                              delete newMappings[file.name];
                              setPortfolioTypeMappings(newMappings);
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      
                      {/* 포트폴리오 타입 매핑 */}
                      <div className="md:w-1/2">
                        <div className="flex items-center space-x-2">
                          <select
                            value={portfolioTypeMappings[file.name] || ''}
                            onChange={(e) => handlePortfolioTypeMappingChange(file.name, e.target.value)}
                            className="flex-grow px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-black"
                          >
                            <option value="">포트폴리오 타입 선택</option>
                            {portfolioTypes.map((type, idx) => (
                              <option key={idx} value={type}>{type}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="hidden md:block text-gray-500 hover:text-gray-700"
                            onClick={() => {
                              const newFiles = [...portfolioFiles];
                              newFiles.splice(index, 1);
                              setPortfolioFiles(newFiles);
                              
                              // 경고 메시지도 제거
                              const newWarnings = {...portfolioFileWarnings};
                              delete newWarnings[file.name];
                              setPortfolioFileWarnings(newWarnings);
                              
                              // 매핑 정보도 제거
                              const newMappings = {...portfolioTypeMappings};
                              delete newMappings[file.name];
                              setPortfolioTypeMappings(newMappings);
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 공통 Monthly Comment 작성 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">공통 Monthly Comment 작성</h2>
          <p className="text-gray-600 text-sm mb-4">모든 고객에게 표시될 월간 코멘트를 작성하세요. 작성하지 않으면 기존 코멘트가 유지됩니다.</p>
          
          <div>
            <label htmlFor="monthlyComment" className="block text-sm font-medium text-gray-700 mb-1">
              월간 코멘트 <span className="text-gray-500 font-normal">(선택사항)</span>
            </label>
            <textarea
              id="monthlyComment"
              rows={6}
              value={monthlyComment}
              onChange={handleCommentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-black"
              placeholder="이번 달의 투자 코멘트를 작성하세요. 작성하지 않으면 기존 코멘트가 유지됩니다."
            ></textarea>
            <p className="mt-1 text-sm text-gray-500">줄 바꿈은 자동으로 적용됩니다.</p>
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