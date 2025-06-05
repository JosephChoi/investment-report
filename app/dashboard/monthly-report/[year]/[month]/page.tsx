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
            await fetchPortfolioReportByType(userAccounts[0].portfolio_type_id);
            
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
          await fetchPortfolioReportByType(accountsData[0].portfolio_type_id);
          
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
            await fetchPortfolioReportByType(accountsData[0].portfolio_type_id);
            
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
          fetchPortfolioReportByType(account.portfolio_type_id)
        ]);
        
        console.log('계좌 변경 완료:', account.portfolio_type_id);
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

  // 포트폴리오 리포트 가져오기
  const fetchPortfolioReportByType = async (portfolioTypeId: string) => {
    try {
      console.log('포트폴리오 리포트 가져오기:', portfolioTypeId, '연도:', year, '월:', month);
      
      if (!portfolioTypeId) {
        console.error('포트폴리오 타입 ID가 제공되지 않았습니다.');
        setError('포트폴리오 정보가 없습니다.');
        return;
      }
      
      // 현재 연도와 월에 해당하는 year_month 형식 생성
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
      console.log('조회할 year_month:', yearMonth);
      
      // 1. 먼저 특정 연도/월에 해당하는 리포트 조회 시도
      const { data: yearMonthData, error: yearMonthError } = await supabase
        .from('portfolio_reports')
        .select('*')
        .eq('portfolio_type_id', portfolioTypeId)
        .eq('year_month', yearMonth)
        .limit(1);
      
      if (yearMonthError) {
        console.error('특정 연도/월 포트폴리오 리포트 조회 오류:', yearMonthError);
      }
      
      // 특정 연도/월에 해당하는 리포트가 있으면 사용
      if (yearMonthData && yearMonthData.length > 0) {
        console.log(`${yearMonth}에 해당하는 포트폴리오 리포트 찾음:`, yearMonthData[0]);
        console.log(`리포트 URL:`, yearMonthData[0].report_url);
        setPortfolioReport(yearMonthData[0]);
        return;
      }
      
      console.log(`${yearMonth}에 해당하는 포트폴리오 리포트가 없습니다. 대체 방법 시도...`);
      
      // 2. 특정 연도/월에 해당하는 리포트가 없으면 report_date 필드로 조회 시도
      // 해당 월의 첫날과 마지막 날 계산
      const firstDayOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0);
      
      const { data: dateRangeData, error: dateRangeError } = await supabase
        .from('portfolio_reports')
        .select('*')
        .eq('portfolio_type_id', portfolioTypeId)
        .gte('report_date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('report_date', lastDayOfMonth.toISOString().split('T')[0])
        .order('report_date', { ascending: false })
        .limit(1);
      
      if (dateRangeError) {
        console.error('날짜 범위 포트폴리오 리포트 조회 오류:', dateRangeError);
      }
      
      // 해당 월 내의 리포트가 있으면 사용
      if (dateRangeData && dateRangeData.length > 0) {
        console.log(`${year}년 ${month}월 내의 포트폴리오 리포트 찾음:`, dateRangeData[0]);
        console.log(`리포트 URL:`, dateRangeData[0].report_url);
        setPortfolioReport(dateRangeData[0]);
        return;
      }
      
      console.log(`${year}년 ${month}월 내의 포트폴리오 리포트가 없습니다. 마지막 대체 방법 시도...`);
      
      // 3. 마지막 대체 방법: 파일명에 연도와 월이 포함된 리포트 찾기
      // 파일명 패턴 검색 조건 개선 및 로깅 추가
      const monthStr = String(month).padStart(2, '0');
      const searchPatterns = [
        `%${year}${monthStr}%`,
        `%${year}_${month}%`,
        `%${year}-${monthStr}%`,
        `%${year}년${month}월%`,
        `%${month}_${year}%`,
        `%global_${monthStr}%`,
        `%global_${monthStr}.jpg%`,
        `%global_${year}_${month}%`,
        `%global_${year}_${month}.jpg%`
      ];
      
      console.log('파일명 검색 패턴:', searchPatterns);
      
      // ILIKE 검색을 위한 조건 생성
      const searchCondition = searchPatterns.map(pattern => `report_url.ilike.${pattern}`).join(',');
      
      const { data: fileNameData, error: fileNameError } = await supabase
        .from('portfolio_reports')
        .select('*')
        .eq('portfolio_type_id', portfolioTypeId)
        .or(searchCondition)
        .order('report_date', { ascending: false })
        .limit(1);
      
      if (fileNameError) {
        console.error('파일명 기반 포트폴리오 리포트 조회 오류:', fileNameError);
        console.error('검색 조건:', searchCondition);
      }
      
      // 파일명에 연도와 월이 포함된 리포트가 있으면 사용
      if (fileNameData && fileNameData.length > 0) {
        console.log(`파일명에 ${year}년 ${month}월이 포함된 포트폴리오 리포트 찾음:`, fileNameData[0]);
        console.log(`리포트 URL:`, fileNameData[0].report_url);
        console.log(`파일명:`, fileNameData[0].report_url.split('/').pop());
        setPortfolioReport(fileNameData[0]);
        return;
      }
      
      console.log(`${year}년 ${month}월에 해당하는 포트폴리오 리포트를 찾을 수 없습니다. 최신 리포트 사용...`);
      
      // 4. 모든 방법이 실패하면 최신 리포트 사용 (기존 방식)
      const { data, error } = await supabase
        .from('portfolio_reports')
        .select('*')
        .eq('portfolio_type_id', portfolioTypeId)
        .order('report_date', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('최신 포트폴리오 리포트 조회 오류:', error);
        setError('포트폴리오 리포트를 불러오는 중 오류가 발생했습니다.');
        return;
      }
      
      if (data && data.length > 0) {
        console.log('최신 포트폴리오 리포트 사용:', data[0]);
        console.log(`리포트 URL:`, data[0].report_url);
        console.log(`파일명:`, data[0].report_url.split('/').pop());
        setPortfolioReport(data[0]);
      } else {
        console.log('포트폴리오 리포트가 없습니다.');
        setPortfolioReport(null);
      }
    } catch (error) {
      console.error('포트폴리오 리포트 처리 오류:', error);
      setError('포트폴리오 리포트를 처리하는 중 오류가 발생했습니다.');
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
      fetchPortfolioReportByType(firstAccount.portfolio_type_id);
    }
  }, [accounts]);
  
  // 선택된 계좌가 변경될 때마다 포트폴리오 리포트 업데이트
  useEffect(() => {
    if (selectedAccount) {
      console.log('선택된 계좌 변경 감지:', selectedAccount.portfolio_type_id);
      fetchPortfolioReportByType(selectedAccount.portfolio_type_id);
    }
  }, [selectedAccount?.id]);

  const getFilePatternsByType = (portfolioType: { name: string }) => {
    // 포트폴리오 타입 이름을 소문자로 변환하고 특수문자를 언더스코어로 변환
    const normalizedType = portfolioType.name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '_');
    
    // 포트폴리오 타입별 파일명 패턴 매핑
    const typePatterns: { [key: string]: string[] } = {
      // 1. 연금 관련 포트폴리오
      '인모스트 연금2호(이전,분할매수)': ['pension'],
      '인모스트 연금(적립식ETF)': ['pension'],
      '인모스트 연금전환형 ISA': ['isa'],
      
      // 2. IRP/EMP 관련 포트폴리오
      '인모스트 IRP EMP': ['irpdcemp'],
      '인모스트 퇴직연금DC EMP': ['irpdcfemp'],
      '인모스트 IRP 멀티에셋 인컴형': ['irpdcincome'],
      '인모스트 IRP 멀티에셋 1호': ['irpdcmulti1pension'],
      '인모스트 분할성장전략EMP': ['split'],
      '인모스트 글로벌 액티브 EMP': ['active'],
      '인모스트 글로벌 성장 EMP': ['global'],
      '인모스트 연금 EMP Plus(이전)': ['pensionplusl'],
      
      // 3. 글로벌/해외 관련 포트폴리오
      '인모스트 글로벌 핀테크': ['fin'],
      '인모스트 글로벌 선택형 ETF': ['choice'],
      '인모스트 해외ETF 적립식': ['split2'],
      
      // 4. 국내 ETF 관련 포트폴리오
      '인모스트 국내 ETF': ['domestic_etf'],
      '인모스트 적립식ETF 일반': ['domestic_etf'],
      
      // 5. 배당형 포트폴리오
      '인모스트 BDC 배당형': ['bdcdividend'],
      '인모스트 멀티에셋 인컴형': ['multiincome'],
      
      // 6. 기타 포트폴리오
      '인모스트 채권전략형': ['bond'],
      '인모스트 채권플러스': ['bondplus'],
      '인모스트 유동성자금전용': ['fee'],
      '인모스트 메가트렌드셀렉션(주식형)': ['mega'],
      '인모스트 위대한유산(증여)': ['mf'],
      '인모스트 그로스&밸류(주식형)': ['groth'],
      '인모스트 Happy Tree 2호': ['happy2']
    };

    // 해당 포트폴리오 타입에 대한 패턴 가져오기
    const patterns = typePatterns[portfolioType.name] || ['portfolio'];
    
    // 패턴에 연도와 월 추가
    const yearMonthPatterns = patterns.map(pattern => `${pattern}_${year}_${month}`);
    
    console.log('포트폴리오 타입:', portfolioType.name);
    console.log('생성된 검색 패턴:', yearMonthPatterns);
    
    return yearMonthPatterns;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link href="/dashboard/monthly-report" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-all duration-300 transform hover:-translate-x-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md hover:shadow-lg border border-white/20">
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>월간 리포트 목록으로 돌아가기</span>
            </Link>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-12 border-2 border-red-100/50 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900">오류 발생</h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-8">
          <Link href="/dashboard/monthly-report" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-all duration-300 transform hover:-translate-x-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md hover:shadow-lg border border-white/20">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>월간 리포트 목록으로 돌아가기</span>
          </Link>
        </div>
        
        {/* 페이지 제목 */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {report?.title || `${year}년 ${month}월 투자 리포트`}
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
        </div>
        
        {/* 포트폴리오 선택 섹션 */}
        <div className="mb-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-8 border-2 border-blue-100/50 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
          <div className="flex items-center mb-6">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-4 flex items-center justify-center">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">포트폴리오 선택</h2>
          </div>
          
          {accounts.length > 1 ? (
            <div className="w-full">
              <select
                id="account-select"
                value={selectedAccount?.id}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl font-medium text-gray-800 bg-gray-50/80 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg shadow-sm hover:shadow-md"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.portfolio?.name || '정보 없음'}
                  </option>
                ))}
              </select>
            </div>
          ) : selectedAccount ? (
            <div className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50 shadow-sm">
              <p className="font-semibold text-lg text-gray-800">{selectedAccount.portfolio?.name || '정보 없음'}</p>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50/80 rounded-xl border-2 border-gray-200/50">
              <p className="text-gray-600 text-lg">등록된 포트폴리오가 없습니다.</p>
            </div>
          )}
        </div>
        
        {/* 계좌 정보 카드 */}
        {selectedAccount && (
          <div className="mb-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-8 border-2 border-green-100/50 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
            <div className="flex items-center mb-6">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-4 flex items-center justify-center">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">계좌 정보</h2>
            </div>
                         <div className="space-y-4">
               <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                 <div className="flex justify-between items-center">
                   <p className="text-sm text-gray-600 font-medium">계좌번호</p>
                   <p className="text-lg font-bold text-gray-900">{selectedAccount.account_number || '정보 없음'}</p>
                 </div>
               </div>
               <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                 <div className="flex justify-between items-start">
                   <p className="text-sm text-gray-600 font-medium flex-shrink-0 mr-4">포트폴리오</p>
                   <p className="text-lg font-bold text-gray-900 text-right leading-tight">{selectedAccount.portfolio?.name || '정보 없음'}</p>
                 </div>
               </div>
               <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                 <div className="flex justify-between items-center">
                   <p className="text-sm text-blue-700 font-medium">전월잔고</p>
                   <p className="text-lg font-bold text-gray-900 text-right">{formatCurrency(getMonthlyBalance())}원</p>
                 </div>
               </div>
             </div>
          </div>
        )}
        
        {/* 이달의 투자 코멘트 카드 */}
        <div className="mb-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-8 border-2 border-purple-100/50 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
          <div className="flex items-center mb-6">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full mr-4 flex items-center justify-center">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">이달의 투자 코멘트</h2>
          </div>
          {monthlyComment ? (
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200/50">
              <div className="prose max-w-none text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: monthlyComment.content }} />
              <div className="mt-6 pt-4 border-t border-purple-200/50 text-right">
                <span className="text-sm text-purple-700 bg-purple-100 px-3 py-1 rounded-full font-medium">
                  {formatDate(monthlyComment.comment_date)} 업데이트
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50/80 rounded-xl border-2 border-gray-200/50">
              <p className="text-gray-600 text-lg">등록된 월간 코멘트가 없습니다.</p>
            </div>
          )}
        </div>
        
        {/* 포트폴리오 리포트 카드 */}
        {selectedAccount && portfolioReport && (
          <div className="mb-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-8 border-2 border-amber-100/50 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
            <div className="flex items-center mb-6">
              <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mr-4 flex items-center justify-center">
                <span className="text-white text-sm font-bold">4</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">포트폴리오 리포트</h2>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-6 text-center">
                <span className="inline-block bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-6 py-3 rounded-full text-lg font-semibold border border-amber-200/50">
                  {selectedAccount.portfolio?.name} 포트폴리오
                </span>
              </div>
              
              {/* 이미지 컨테이너 */}
              <div className="relative w-full max-w-4xl h-[600px] border-2 border-gray-200/50 rounded-xl overflow-hidden shadow-lg bg-white">
                {/* 이미지 로딩 상태 표시 */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-0">
                  <div className="text-center">
                    <div className="w-12 h-12 border-t-4 border-b-4 border-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-gray-500 font-medium">리포트 로딩 중...</div>
                  </div>
                                 </div>
                 
                 {/* 이미지 표시 - 여러 방식 시도 */}
                 {/* 1. 일반 img 태그 - 캐시 방지를 위한 타임스탬프와 연도/월 정보 추가 */}
                 <img
                   src={`${portfolioReport.report_url}${portfolioReport.report_url.includes('?') ? '&' : '?'}year=${year}&month=${month}&t=${Date.now()}`}
                   alt={`${selectedAccount.portfolio?.name} 포트폴리오 리포트 (${year}년 ${month}월)`}
                   className="w-full h-full object-contain z-10 relative"
                   onLoad={(e) => {
                     console.log('이미지 로드 성공:', portfolioReport.report_url);
                     (e.target as HTMLElement).style.zIndex = '10';
                   }}
                   onError={(e) => {
                     console.error('이미지 로드 실패:', portfolioReport.report_url);
                     (e.target as HTMLElement).style.display = 'none';
                     const iframe = document.getElementById('report-iframe');
                     if (iframe) {
                       (iframe as HTMLElement).style.display = 'block';
                     }
                   }}
                   loading="eager"
                   fetchPriority="high"
                   crossOrigin="anonymous"
                 />
                 
                 {/* 2. iframe 방식 (img 태그 실패 시) */}
                 <iframe
                   id="report-iframe"
                   src={`${portfolioReport.report_url}${portfolioReport.report_url.includes('?') ? '&' : '?'}year=${year}&month=${month}&t=${Date.now()}`}
                   title={`${selectedAccount.portfolio?.name} 포트폴리오 리포트 (${year}년 ${month}월)`}
                   className="w-full h-full z-1 relative"
                   style={{ border: 'none', display: 'none' }}
                 />
               </div>
               
               {/* 버튼 그룹 - 이미지 아래에 배치 */}
               <div className="flex justify-center space-x-6 mt-8 w-full">
                 <a 
                   href={`${portfolioReport.report_url}${portfolioReport.report_url.includes('?') ? '&' : '?'}year=${year}&month=${month}&t=${Date.now()}`}
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 font-medium"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                   </svg>
                   새창으로 보기
                 </a>
                 <button 
                   onClick={async () => {
                     try {
                       console.log('파일 다운로드 시작...');
                       const downloadUrl = `${portfolioReport.report_url}${portfolioReport.report_url.includes('?') ? '&' : '?'}year=${year}&month=${month}&t=${Date.now()}`;
                       const response = await fetch(downloadUrl);
                       
                       if (!response.ok) {
                         throw new Error(`HTTP error! status: ${response.status}`);
                       }
                       
                       const blob = await response.blob();
                       let fileExtension = 'jpg';
                       
                       const urlPath = new URL(portfolioReport.report_url).pathname;
                       const extensionMatch = urlPath.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
                       if (extensionMatch && extensionMatch[1]) {
                         fileExtension = extensionMatch[1].toLowerCase();
                       }
                       
                       const url = window.URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.style.display = 'none';
                       a.href = url;
                       a.download = `${selectedAccount.portfolio?.name}_포트폴리오_${year}년_${month}월.${fileExtension}`;
                       
                       document.body.appendChild(a);
                       a.click();
                       
                       window.URL.revokeObjectURL(url);
                       document.body.removeChild(a);
                       
                       console.log('파일 다운로드 완료');
                     } catch (error) {
                       console.error('파일 다운로드 오류:', error);
                       alert('파일 다운로드 중 오류가 발생했습니다.');
                     }
                   }}
                   className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 font-medium"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                   다운로드
                 </button>
               </div>
             </div>
           </div>
         )}
         
         {/* 잔고 변화 그래프 카드 */}
         {selectedAccount && (
           <div className="mb-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-8 border-2 border-emerald-100/50 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
             <div className="flex items-center mb-6">
               <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mr-4 flex items-center justify-center">
                 <span className="text-white text-sm font-bold">5</span>
               </div>
               <h2 className="text-2xl font-bold text-gray-900">잔고 변화 추이 - {selectedAccount.portfolio?.name}</h2>
             </div>
             
             {balanceData.length > 0 ? (
               <>
                 {/* 클라이언트 측에서만 차트 렌더링 */}
                 {isClient && (
                   <div className="h-96 mb-8 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200/50">
                     <ChartWrapper data={balanceData.map(record => ({
                       date: record.record_date,
                       balance: typeof record.balance === 'string' ? parseFloat(record.balance) : record.balance,
                       year_month: record.year_month
                     }))} />
                   </div>
                 )}
                 
                 {/* 잔고변화 안내문구 */}
                 <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200/50 rounded-xl shadow-sm">
                   <div className="flex items-start">
                     <div className="flex-shrink-0 mr-4">
                       <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                         <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                         </svg>
                       </div>
                     </div>
                     <div>
                       <h3 className="font-semibold text-orange-800 mb-2">잔고 변화 안내</h3>
                       <p className="text-sm text-orange-700 leading-relaxed">
                         잔고변화는 계좌 내 입금, 출금등의 상황을 반영한 매 월초 기준 계좌의 평가금 추이로 이는 수익률을 의미하지 않습니다.
                       </p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="mb-8">
                   <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50 text-center shadow-sm">
                     <p className="text-sm text-blue-700 mb-2 font-medium">전월잔고</p>
                     <p className="text-3xl font-bold text-gray-900">{formatCurrency(getMonthlyBalance())}원</p>
                   </div>
                 </div>
                 
                 {/* 월별 잔고 데이터 테이블 */}
                 <div className="overflow-hidden rounded-xl border-2 border-gray-200/50 shadow-sm">
                   <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200/50">
                     <h3 className="text-lg font-semibold text-gray-900">월별 잔고 변화</h3>
                   </div>
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50/80">
                       <tr>
                         <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                           년월
                         </th>
                         <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                           잔고
                         </th>
                         <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                           변화율
                         </th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {balanceData
                         .filter((value, index, self) => 
                           index === self.findIndex(t => t.year_month === value.year_month)
                         )
                         .sort((a, b) => b.year_month.localeCompare(a.year_month))
                         .map((record, index, array) => {
                           const currentBalance = typeof record.balance === 'string' ? parseFloat(record.balance) : record.balance;
                           const prevRecord = index < array.length - 1 ? array[index + 1] : null;
                           const prevBalance = prevRecord 
                             ? (typeof prevRecord.balance === 'string' ? parseFloat(prevRecord.balance) : prevRecord.balance)
                             : currentBalance;
                           
                           const changeRate = prevBalance !== 0 
                             ? ((currentBalance - prevBalance) / prevBalance) * 100 
                             : 0;
                           
                           return (
                             <tr key={record.year_month} className="hover:bg-blue-50/30 transition-all duration-300">
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                 {record.year_month}
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                 {formatCurrency(currentBalance)}원
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                 {index < array.length - 1 ? (
                                   <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                     changeRate > 0 
                                       ? 'bg-green-100 text-green-800 border border-green-200' 
                                       : changeRate < 0 
                                         ? 'bg-red-100 text-red-800 border border-red-200' 
                                         : 'bg-gray-100 text-gray-800 border border-gray-200'
                                   }`}>
                                     {changeRate > 0 ? '+' : ''}{changeRate.toFixed(2)}%
                                   </span>
                                 ) : (
                                   <span className="text-gray-500 font-medium">-</span>
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
               <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200/50">
                 <div className="max-w-md mx-auto">
                   <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                   </div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-2">잔고 데이터가 없습니다</h3>
                   <p className="text-gray-600 leading-relaxed">해당 기간에 계좌 데이터가 없습니다. 다른 계좌를 선택하거나 관리자에게 문의하세요.</p>
                 </div>
               </div>
             )}
           </div>
         )}
       </div>
     </div>
   );
} 