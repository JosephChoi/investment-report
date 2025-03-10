'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import ChartWrapper from '@/components/chart-wrapper';
import React from 'react';

interface PageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

export default function MonthlyReportDetail({ params }: PageProps) {
  // Next.js 15에서는 params가 Promise이므로 React.use()를 사용하여 접근해야 합니다.
  const resolvedParams = React.use(params);
  const { year, month } = resolvedParams;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [balanceData, setBalanceData] = useState<any[]>([]);
  const [monthlyComment, setMonthlyComment] = useState<any>(null);
  const [portfolioReport, setPortfolioReport] = useState<any>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const router = useRouter();

  // 클라이언트 측 렌더링을 위한 상태
  const [isClient, setIsClient] = useState(false);
  
  // 클라이언트 측 렌더링 처리
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('로그인이 필요합니다.');
          setLoading(false);
          return;
        }
        
        setUser(user);
        console.log('로그인한 사용자 정보:', user);
        
        // 월간 리포트 데이터 가져오기
        const year_month = `${year}-${String(month).padStart(2, '0')}`;
        const { data: reportData, error: reportError } = await supabase
          .from('monthly_reports')
          .select('*')
          .eq('year_month', year_month)
          .single();
          
        if (reportError) {
          console.error('월간 리포트 데이터 가져오기 오류:', reportError);
          setError('월간 리포트 데이터를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
          return;
        }
        
        setReport(reportData);
        
        // 사용자 계좌 정보 가져오기
        await fetchUserAccounts(user);
        
        // 월간 코멘트는 계좌 정보와 상관없이 가져옵니다
        await fetchMonthlyComment();
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router, year, month]);

  // 사용자 계좌 정보 가져오기 함수
  const fetchUserAccounts = async (user: any) => {
    try {
      console.log('계좌 정보 가져오기 시작...');
      
      if (!user || !user.email) {
        console.error('사용자 정보가 없거나 이메일이 없습니다.');
        setError('사용자 정보를 불러올 수 없습니다.');
        setLoading(false);
        return;
      }
      
      console.log('현재 로그인한 사용자 이메일:', user.email);
      
      try {
        // 서비스 역할 키를 사용하는 API를 통해 계좌 정보 가져오기
        const response = await fetch('/api/get-all-accounts');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          console.log('모든 계좌 정보:', result.data);
          
          // 현재 로그인한 사용자의 이메일과 일치하는 계좌만 필터링
          const userAccounts = result.data.filter((account: any) => {
            return account.user && 
                   account.user.email && 
                   account.user.email.toLowerCase() === user.email.toLowerCase();
          });
          
          if (userAccounts.length > 0) {
            console.log('현재 사용자의 실제 계좌 정보:', userAccounts);
            setAccounts(userAccounts);
            setSelectedAccount(userAccounts[0]);
            
            // 선택된 계좌의 잔고 데이터 가져오기
            await fetchBalanceData(userAccounts[0].id);
            
            // 선택된 계좌의 포트폴리오 리포트 가져오기
            await fetchPortfolioReportByType(userAccounts[0].portfolio_type);
            
            return;
          } else {
            console.log('일치하는 실제 계좌 정보가 없습니다. 사용자 이메일:', user.email);
          }
        }
        
        // 백업 방법: 직접 Supabase 쿼리
        console.log('백업 방법으로 계좌 정보 가져오기 시도...');
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);
        
        if (accountsError) {
          console.error('계좌 정보 쿼리 오류:', accountsError);
          throw accountsError;
        }
        
        if (accountsData && accountsData.length > 0) {
          console.log('백업 방법으로 가져온 계좌 정보:', accountsData);
          setAccounts(accountsData);
          setSelectedAccount(accountsData[0]);
          
          // 선택된 계좌의 잔고 데이터 가져오기
          await fetchBalanceData(accountsData[0].id);
          
          // 선택된 계좌의 포트폴리오 리포트 가져오기
          await fetchPortfolioReportByType(accountsData[0].portfolio_type);
          
          return;
        }
        
        // 계좌 정보가 없는 경우
        console.log('계좌 정보를 찾을 수 없습니다.');
        setError('등록된 계좌 정보가 없습니다. 관리자에게 문의하여 계좌 정보를 등록해주세요.');
      } catch (apiError) {
        console.error('API 호출 오류:', apiError);
        
        // API 호출 실패 시 직접 Supabase 쿼리
        try {
          console.log('API 호출 실패, 직접 Supabase 쿼리 시도...');
          const { data: accountsData, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', user.id);
          
          if (accountsError) throw accountsError;
          
          if (accountsData && accountsData.length > 0) {
            console.log('직접 쿼리로 가져온 계좌 정보:', accountsData);
            setAccounts(accountsData);
            setSelectedAccount(accountsData[0]);
            
            // 선택된 계좌의 잔고 데이터 가져오기
            await fetchBalanceData(accountsData[0].id);
            
            // 선택된 계좌의 포트폴리오 리포트 가져오기
            await fetchPortfolioReportByType(accountsData[0].portfolio_type);
            
            return;
          }
          
          // 계좌 정보가 없는 경우
          console.log('계좌 정보를 찾을 수 없습니다.');
          setError('등록된 계좌 정보가 없습니다. 관리자에게 문의하여 계좌 정보를 등록해주세요.');
        } catch (supabaseError) {
          console.error('Supabase 쿼리 오류:', supabaseError);
          throw supabaseError;
        }
      }
    } catch (error) {
      console.error('계좌 정보 가져오기 오류:', error);
      setError('계좌 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 계좌 변경 시 데이터 다시 가져오기
  const handleAccountChange = async (accountId: string) => {
    try {
      console.log('계좌 변경:', accountId);
      
      if (!accountId) {
        console.error('유효하지 않은 계좌 ID입니다.');
        return;
      }
      
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) {
        console.error('선택한 계좌를 찾을 수 없습니다:', accountId);
        return;
      }
      
      setSelectedAccount(account);
      
      // 데이터 로딩 중 상태 설정
      setLoading(true);
      
      try {
        // 병렬로 데이터 가져오기
        await Promise.all([
          fetchBalanceData(account.id),
          fetchPortfolioReportByType(account.portfolio_type)
        ]);
        
        console.log('계좌 변경 완료:', account.portfolio_type);
      } catch (dataError) {
        console.error('계좌 데이터 가져오기 오류:', dataError);
        setError('계좌 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('계좌 변경 중 오류 발생:', error);
      setError('계좌 정보를 변경하는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 포트폴리오 타입으로 직접 리포트 가져오기 (새 함수)
  const fetchPortfolioReportByType = async (portfolioType: string) => {
    try {
      console.log('포트폴리오 타입으로 리포트 가져오기 시작:', portfolioType);
      
      if (!portfolioType) {
        console.error('포트폴리오 타입이 없습니다.');
        return;
      }
      
      const year_month = `${year}-${String(month).padStart(2, '0')}`;
      
      console.log('포트폴리오 리포트 조회 조건:', { portfolioType, year_month });
      
      // 1. 먼저 portfolio_reports 테이블에서 조회
      try {
        console.log('portfolio_reports 테이블에서 조회 시도...');
        const { data: reportData, error: reportError } = await supabase
          .from('portfolio_reports')
          .select('*')
          .eq('portfolio_type', portfolioType)
          .order('report_date', { ascending: false })
          .limit(1);
          
        if (reportError) {
          console.error('portfolio_reports 테이블 조회 오류:', reportError);
        } else if (reportData && reportData.length > 0) {
          console.log('portfolio_reports 테이블에서 데이터 찾음:', reportData[0]);
          
          // 테이블에서 URL 가져오기
          const dbUrl = reportData[0].report_url;
          console.log('데이터베이스에서 가져온 URL:', dbUrl);
          
          // 포트폴리오 리포트 데이터 설정
          setPortfolioReport({
            id: reportData[0].id,
            portfolio_type: reportData[0].portfolio_type,
            year_month: year_month,
            report_url: dbUrl, // 일단 DB에서 가져온 URL 사용
            report_date: reportData[0].report_date || new Date().toISOString()
          });
          
          // URL이 유효한지 확인하고 필요한 경우 스토리지에서 새 URL 생성
          if (!dbUrl || !dbUrl.startsWith('http')) {
            console.log('DB URL이 유효하지 않습니다. 스토리지에서 새 URL 생성 시도...');
            
            // 포트폴리오 타입에 따라 파일 경로 결정
            let filePath = getFilePathByPortfolioType(portfolioType);
            
            // 스토리지에서 URL 생성
            const storageUrl = await getStorageUrl('portfolio-reports', filePath);
            
            if (storageUrl) {
              console.log('스토리지에서 새 URL 생성 성공:', storageUrl);
              
              // 새 URL로 업데이트
              setPortfolioReport((prev: any) => ({
                ...prev,
                report_url: storageUrl
              }));
            }
          }
          
          return;
        }
      } catch (dbError) {
        console.error('DB 조회 중 오류 발생:', dbError);
      }
      
      // 2. DB에서 찾지 못한 경우 스토리지에서 직접 URL 생성
      console.log('DB에서 데이터를 찾지 못해 스토리지에서 직접 URL 생성 시도...');
      
      // 포트폴리오 타입에 따라 파일 경로 결정
      let filePath = getFilePathByPortfolioType(portfolioType);
      
      // 스토리지에서 URL 생성
      const storageUrl = await getStorageUrl('portfolio-reports', filePath);
      
      if (storageUrl) {
        console.log('스토리지에서 URL 생성 성공:', storageUrl);
        
        // 포트폴리오 리포트 데이터 설정
        setPortfolioReport({
          id: 'storage',
          portfolio_type: portfolioType,
          year_month: year_month,
          report_url: storageUrl,
          report_date: new Date().toISOString()
        });
        
        return;
      }
      
      // 3. 모든 시도 실패 시 플레이스홀더 이미지 사용
      console.log('모든 시도 실패. 플레이스홀더 이미지 사용');
      
      const placeholderUrl = `https://placehold.co/800x600/png?text=${encodeURIComponent(portfolioType)}+리포트+(${year}-${month})`;
      
      // 포트폴리오 리포트 데이터 설정
      setPortfolioReport({
        id: 'placeholder',
        portfolio_type: portfolioType,
        year_month: year_month,
        report_url: placeholderUrl,
        report_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('포트폴리오 리포트 가져오기 오류:', error);
    }
  };
  
  // 포트폴리오 타입에 따라 파일 경로 결정하는 함수 (중복 코드 제거)
  const getFilePathByPortfolioType = (portfolioType: string): string => {
    console.log('포트폴리오 타입에 따른 파일 경로 결정:', portfolioType);
    
    // 대소문자 구분 없이 비교하기 위해 소문자로 변환
    const type = portfolioType.toLowerCase();
    
    // 더 정확한 매칭을 위해 정규식 패턴 사용
    if (type.includes('국내') && type.includes('etf')) {
      console.log('국내 ETF 포트폴리오 이미지 선택');
      return 'portfolio-reports/2025/03/__EMP_3.JPG';
    } else if (type.includes('연금') || type.includes('적립식') || type.includes('irp')) {
      console.log('연금/IRP 포트폴리오 이미지 선택');
      return 'portfolio-reports/2025/03/_IRP_1_EMP_3.JPG';
    } else if (type.includes('isa')) {
      console.log('ISA 포트폴리오 이미지 선택');
      return 'portfolio-reports/2025/03/ISA_EMP_3.JPG';
    } else if (type.includes('bdc')) {
      console.log('BDC 포트폴리오 이미지 선택');
      return 'portfolio-reports/2025/03/_BDC__3.JPG';
    } else {
      // 기본값으로 국내 ETF 이미지 사용
      console.log('기본 포트폴리오 이미지 선택 (매칭되는 타입 없음)');
      return 'portfolio-reports/2025/03/__EMP_3.JPG';
    }
  };

  // 잔고 데이터 가져오기
  const fetchBalanceData = async (accountId: string) => {
    try {
      console.log('잔고 데이터 가져오기 시작:', { accountId, year, month });
      
      if (!accountId) {
        console.error('계좌 ID가 유효하지 않습니다.');
        setBalanceData([]);
        return;
      }
      
      // 해당 계좌의 모든 잔고 데이터 조회
      console.log(`계좌 ID ${accountId}의 모든 잔고 데이터 조회 시도...`);
      const { data, error } = await supabase
        .from('balance_records')
        .select('*')
        .eq('account_id', accountId);
      
      if (error) {
        console.error('잔고 데이터 조회 오류:', error);
        setBalanceData([]);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('해당 계좌의 잔고 데이터가 없습니다:', accountId);
        setBalanceData([]);
        return;
      }
      
      console.log(`계좌 ID ${accountId}의 잔고 데이터 (${data.length}개):`, data);
      
      // 데이터 유효성 검사 및 변환
      const validData = data.map(record => ({
        ...record,
        balance: record.balance !== null && record.balance !== undefined 
          ? (typeof record.balance === 'string' ? parseFloat(record.balance) : record.balance) 
          : 0
      }));
      
      // 데이터를 year_month 기준으로 정렬 (과거 -> 최근)
      const sortedData = validData.sort((a, b) => {
        // year_month 형식: "YYYY-MM"
        if (a.year_month && b.year_month) {
          return a.year_month.localeCompare(b.year_month);
        }
        
        // 날짜 기준으로 정렬 (대체 방법)
        const dateA = new Date(a.record_date);
        const dateB = new Date(b.record_date);
        return dateA.getTime() - dateB.getTime();
      });
      
      console.log('정렬된 잔고 데이터:', sortedData);
      console.log('데이터 기간:', sortedData.map(d => d.year_month).join(', '));
      
      // 모든 데이터를 사용하여 그래프 표시
      setBalanceData(sortedData);
    } catch (error) {
      console.error('잔고 데이터 처리 오류:', error);
      setBalanceData([]);
    }
  };

  // 월간 코멘트 가져오기
  const fetchMonthlyComment = async () => {
    try {
      // year_month 형식으로 조회
      const year_month = `${year}-${String(month).padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from('monthly_comments')
        .select('*')
        .eq('year_month', year_month)
        .single();
        
      if (error) {
        console.error('월간 코멘트 가져오기 오류:', error);
        return;
      }
      
      setMonthlyComment(data);
    } catch (error) {
      console.error('월간 코멘트 가져오기 오류:', error);
    }
  };

  // 스토리지 URL 생성 함수
  const getStorageUrl = async (bucket: string, path: string) => {
    try {
      console.log(`스토리지 URL 생성 시도: 버킷=${bucket}, 경로=${path}`);
      
      // 1. 공개 URL 시도 (버킷이 퍼블릭으로 설정되었으므로 이제 작동해야 함)
      try {
        const { data: publicData } = await supabase
          .storage
          .from(bucket)
          .getPublicUrl(path);
          
        if (publicData?.publicUrl) {
          console.log('공개 URL 생성 성공:', publicData.publicUrl);
          
          // URL이 유효한지 확인
          try {
            const response = await fetch(publicData.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              console.log('공개 URL 유효성 확인 성공');
              return publicData.publicUrl;
            } else {
              console.log(`공개 URL 유효성 검사 실패: ${response.status} ${response.statusText}`);
            }
          } catch (fetchError) {
            console.error('URL 유효성 검사 중 오류:', fetchError);
          }
        }
      } catch (publicUrlError) {
        console.error('공개 URL 생성 중 오류:', publicUrlError);
      }
      
      // 2. 서명된 URL 시도 (백업)
      try {
        const { data, error } = await supabase
          .storage
          .from(bucket)
          .createSignedUrl(path, 31536000); // 1년(365일) 유효한 서명된 URL 생성
          
        if (error) {
          console.error('서명된 URL 생성 오류:', error);
        } else if (data?.signedUrl) {
          console.log('서명된 URL 생성 성공:', data.signedUrl);
          return data.signedUrl;
        }
      } catch (signedUrlError) {
        console.error('서명된 URL 생성 중 오류:', signedUrlError);
      }
      
      // 3. 모든 시도 실패 시 플레이스홀더 이미지 URL 반환
      console.log('URL 생성 실패. 플레이스홀더 이미지 URL 반환');
      return `https://placehold.co/800x600/png?text=${encodeURIComponent(bucket)}+${encodeURIComponent(path)}`;
    } catch (error) {
      console.error('스토리지 URL 생성 오류:', error);
      return null;
    }
  };

  // 월별 잔고 가져오기
  const getMonthlyBalance = () => {
    if (balanceData.length === 0) {
      console.log('잔고 데이터가 없습니다.');
      return 0;
    }
    
    console.log('월별 잔고 계산 중... 전체 데이터:', balanceData);
    
    // 현재 월 데이터 찾기 (year_month 필드 사용)
    const currentYearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const currentMonthData = balanceData.filter(record => record.year_month === currentYearMonth);
    
    console.log('현재 월 데이터 (필터링 결과):', currentMonthData);
    
    // 현재 월 데이터가 있으면 해당 잔고를 반환
    if (currentMonthData.length > 0) {
      // 문자열인 경우 숫자로 변환
      const rawBalance = currentMonthData[0].balance;
      const currentBalance = typeof rawBalance === 'string' ? parseFloat(rawBalance) : rawBalance;
      
      console.log('현재 월 잔고 (원본):', rawBalance);
      console.log('현재 월 잔고 (변환):', currentBalance);
      
      // 숫자가 아니면 0 반환
      if (isNaN(currentBalance)) {
        console.error('현재 잔고 값이 숫자가 아닙니다:', rawBalance);
        return 0;
      }
      
      return currentBalance;
    }
    
    // 현재 월 데이터가 없으면 가장 최근 데이터 사용
    const sortedData = [...balanceData].sort((a, b) => {
      const dateA = new Date(a.record_date);
      const dateB = new Date(b.record_date);
      return dateB.getTime() - dateA.getTime(); // 내림차순 정렬 (최신 -> 과거)
    });
    
    if (sortedData.length > 0) {
      const latestRecord = sortedData[0];
      const rawBalance = latestRecord.balance;
      const latestBalance = typeof rawBalance === 'string' ? parseFloat(rawBalance) : rawBalance;
      
      console.log('최신 잔고 데이터 사용:', latestRecord);
      return latestBalance;
    }
    
    // 데이터가 없으면 0 반환
    console.warn('잔고 데이터를 찾을 수 없습니다.');
    return 0;
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '날짜 정보 없음';
      
      // 날짜 문자열을 파싱하여 년, 월, 일 추출
      const date = new Date(dateString);
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        return '날짜 정보 없음';
      }
      
      // 서버와 클라이언트에서 동일한 결과를 반환하도록 수동으로 포맷팅
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      return `${year}년 ${month}월 ${day}일`;
    } catch (error) {
      console.error('날짜 포맷 오류:', error);
      return '날짜 정보 없음';
    }
  };

  // 초기 데이터 로드 - 첫 번째 계좌 선택
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      const firstAccount = accounts[0];
      setSelectedAccount(firstAccount);
      
      fetchBalanceData(firstAccount.id);
      fetchPortfolioReportByType(firstAccount.portfolio_type);
    }
  }, [accounts]);
  
  // 선택된 계좌가 변경될 때마다 포트폴리오 리포트 업데이트
  useEffect(() => {
    if (selectedAccount) {
      console.log('선택된 계좌 변경 감지:', selectedAccount.portfolio_type);
      fetchPortfolioReportByType(selectedAccount.portfolio_type);
    }
  }, [selectedAccount?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <Link href="/dashboard/monthly-report" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>월간 리포트 목록으로 돌아가기</span>
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">오류 발생</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <Link href="/dashboard/monthly-report" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>월간 리포트 목록으로 돌아가기</span>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        {report?.title || `${year}년 ${month}월 투자 리포트`}
      </h1>
      
      {/* 포트폴리오 선택 섹션 - 강조 */}
      <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-blue-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
          <span className="inline-block w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
          포트폴리오 선택
        </h2>
        
        {accounts.length > 1 ? (
          <div className="w-full">
            <select
              id="account-select"
              value={selectedAccount?.id}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.portfolio_type}
                </option>
              ))}
            </select>
          </div>
        ) : selectedAccount ? (
          <div className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-medium text-lg text-gray-800">{selectedAccount.portfolio_type}</p>
          </div>
        ) : (
          <p className="text-gray-600">등록된 포트폴리오가 없습니다.</p>
        )}
      </div>
      
      {/* 계좌 정보 카드 */}
      {selectedAccount && (
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
            <span className="inline-block w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
            계좌 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">계좌번호</p>
              <p className="text-lg font-medium text-gray-900">{selectedAccount.account_number || '정보 없음'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">포트폴리오</p>
              <p className="text-lg font-medium text-gray-900">{selectedAccount.portfolio_type}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">전월잔고</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(getMonthlyBalance())}원</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 이달의 투자 코멘트 카드 */}
      <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
          <span className="inline-block w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
          이달의 투자 코멘트
        </h2>
        {monthlyComment ? (
          <>
            <div className="prose text-gray-800" dangerouslySetInnerHTML={{ __html: monthlyComment.content }} />
            <div className="mt-4 text-right text-sm text-gray-500">
              {formatDate(monthlyComment.comment_date)} 업데이트
            </div>
          </>
        ) : (
          <p className="text-gray-600">등록된 월간 코멘트가 없습니다.</p>
        )}
      </div>
      
      {/* 포트폴리오 리포트 카드 */}
      {selectedAccount && portfolioReport && (
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
            <span className="inline-block w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
            포트폴리오 리포트
          </h2>
          <div className="flex flex-col items-center">
            <div className="mb-3 text-center">
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {selectedAccount.portfolio_type} 포트폴리오
              </span>
            </div>
            
            {/* 이미지 컨테이너 */}
            <div className="relative w-full max-w-4xl h-[500px] border border-gray-200 rounded-lg overflow-hidden">
              {/* 이미지 로딩 상태 표시 */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
                <div className="text-gray-500">이미지 로딩 중...</div>
              </div>
              
              {/* 이미지 표시 - 여러 방식 시도 */}
              {/* 1. 일반 img 태그 - 캐시 방지를 위한 타임스탬프 추가 */}
              <img
                src={`${portfolioReport.report_url}?t=${Date.now()}`}
                alt={`${selectedAccount.portfolio_type} 포트폴리오 리포트`}
                className="w-full h-full object-contain z-10 relative"
                onLoad={(e) => {
                  // 이미지 로드 성공 시 z-index 조정
                  (e.target as HTMLElement).style.zIndex = '10';
                }}
                onError={(e) => {
                  // 이미지 로드 실패 시 숨김
                  (e.target as HTMLElement).style.display = 'none';
                  
                  // iframe 시도
                  const iframe = document.getElementById('report-iframe');
                  if (iframe) {
                    (iframe as HTMLElement).style.display = 'block';
                  }
                }}
              />
              
              {/* 2. iframe 방식 (img 태그 실패 시) */}
              <iframe
                id="report-iframe"
                src={portfolioReport.report_url}
                title={`${selectedAccount.portfolio_type} 포트폴리오 리포트`}
                className="w-full h-full z-1 relative"
                style={{ border: 'none', display: 'none' }}
                onLoad={() => console.log('iframe 로드 성공')}
                onError={() => {
                  console.error('iframe 로드 오류');
                  
                  // iframe도 실패하면 background-image 방식 시도
                  const bgDiv = document.getElementById('report-bg-div');
                  if (bgDiv) {
                    (bgDiv as HTMLElement).style.display = 'block';
                  }
                }}
              />
              
              {/* 3. background-image 방식 (다른 방식이 모두 실패할 경우) */}
              <div
                id="report-bg-div"
                className="w-full h-full z-1 relative"
                style={{
                  backgroundImage: `url(${portfolioReport.report_url})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  display: 'none'
                }}
              />
              
              {/* 4. 대체 이미지 (모든 방식이 실패할 경우) */}
              <div
                id="fallback-image"
                className="w-full h-full flex items-center justify-center"
                style={{ display: 'none' }}
              >
                <div className="text-center p-4">
                  <p className="text-gray-600 mb-4">이미지를 불러올 수 없습니다.</p>
                  <div className="bg-gray-100 p-4 rounded-lg inline-block">
                    <p className="text-gray-500">{selectedAccount.portfolio_type} 포트폴리오 ({year}년 {month}월)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 잔고 변화 그래프 카드 */}
      {selectedAccount && (
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
            <span className="inline-block w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
            잔고 변화 추이 - {selectedAccount.portfolio_type}
          </h2>
          {balanceData.length > 0 ? (
            <>
              {/* 클라이언트 측에서만 차트 렌더링 */}
              {isClient && (
                <div className="h-96 mb-6">
                  <ChartWrapper data={balanceData.map(record => ({
                    date: record.record_date,
                    balance: typeof record.balance === 'string' ? parseFloat(record.balance) : record.balance,
                    year_month: record.year_month
                  }))} />
                </div>
              )}
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 flex-1">
                  <p className="text-sm text-blue-600 mb-1">전월잔고</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(getMonthlyBalance())}원</p>
                </div>
              </div>
              
              {/* 월별 잔고 데이터 테이블 */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        년월
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        잔고
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        변화율
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {balanceData
                      .filter((value, index, self) => 
                        index === self.findIndex(t => t.year_month === value.year_month)
                      )
                      .sort((a, b) => b.year_month.localeCompare(a.year_month)) // 최신순 정렬
                      .map((record, index, array) => {
                        // 이전 달 데이터 찾기
                        const currentBalance = typeof record.balance === 'string' ? parseFloat(record.balance) : record.balance;
                        const prevRecord = index < array.length - 1 ? array[index + 1] : null;
                        const prevBalance = prevRecord 
                          ? (typeof prevRecord.balance === 'string' ? parseFloat(prevRecord.balance) : prevRecord.balance)
                          : currentBalance;
                        
                        // 변화율 계산
                        const changeRate = prevBalance !== 0 
                          ? ((currentBalance - prevBalance) / prevBalance) * 100 
                          : 0;
                        
                        return (
                          <tr key={record.year_month} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.year_month}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(currentBalance)}원
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {index < array.length - 1 ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  changeRate > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : changeRate < 0 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {changeRate > 0 ? '+' : ''}{changeRate.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-gray-600 font-medium">잔고 데이터가 없습니다.</p>
              <p className="text-sm text-gray-500 mt-1">해당 기간에 계좌 데이터가 없습니다. 다른 계좌를 선택하거나 관리자에게 문의하세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 