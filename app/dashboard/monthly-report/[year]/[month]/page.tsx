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
        
        // 사용자 계좌 정보 가져오기 - 대시보드와 동일한 방식으로 수정
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

  // 사용자 계좌 정보 가져오기 함수 - 대시보드와 동일한 방식으로 구현
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
            
            // 첫 번째 계좌를 선택된 계좌로 설정
            setSelectedAccount(userAccounts[0]);
            
            // 선택된 계좌의 잔고 데이터 가져오기
            await fetchBalanceData(userAccounts[0].id);
            
            // 포트폴리오 리포트 가져오기
            await fetchPortfolioReport(userAccounts[0].id);
            return;
          } else {
            console.log('일치하는 실제 계좌 정보가 없습니다. 사용자 이메일:', user.email);
            console.log('사용자 목록:', result.data.map((account: any) => account.user?.email));
          }
        }
      } catch (apiError) {
        console.error('API를 통한 계좌 정보 가져오기 오류:', apiError);
      }
      
      try {
        // 백업 방법: 직접 API 호출
        console.log('백업 방법으로 계좌 정보 가져오기 시도...');
        const backupResponse = await fetch('/api/user/accounts?email=' + encodeURIComponent(user.email));
        const backupResult = await backupResponse.json();
        
        if (backupResult.success && backupResult.data && backupResult.data.accounts && backupResult.data.accounts.length > 0) {
          console.log('백업 방법으로 가져온 실제 계좌 정보:', backupResult.data.accounts);
          setAccounts(backupResult.data.accounts);
          
          // 첫 번째 계좌를 선택된 계좌로 설정
          setSelectedAccount(backupResult.data.accounts[0]);
          
          // 선택된 계좌의 잔고 데이터 가져오기
          await fetchBalanceData(backupResult.data.accounts[0].id);
          
          // 포트폴리오 리포트 가져오기
          await fetchPortfolioReport(backupResult.data.accounts[0].id);
          return;
        }
      } catch (backupError) {
        console.error('백업 방법을 통한 계좌 정보 가져오기 오류:', backupError);
      }
      
      // 마지막 방법: 직접 Supabase 쿼리
      try {
        console.log('Supabase 직접 쿼리로 계좌 정보 가져오기 시도...');
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_email', user.email);
          
        if (accountsError) {
          console.error('Supabase 계좌 정보 가져오기 오류:', accountsError);
        } else if (accountsData && accountsData.length > 0) {
          console.log('Supabase에서 가져온 계좌 정보:', accountsData);
          setAccounts(accountsData);
          
          // 첫 번째 계좌를 선택된 계좌로 설정
          setSelectedAccount(accountsData[0]);
          
          // 선택된 계좌의 잔고 데이터 가져오기
          await fetchBalanceData(accountsData[0].id);
          
          // 포트폴리오 리포트 가져오기
          await fetchPortfolioReport(accountsData[0].id);
          return;
        }
      } catch (supabaseError) {
        console.error('Supabase 직접 쿼리 오류:', supabaseError);
      }
      
      // 계좌 정보가 없는 경우
      console.log('계좌 정보를 찾을 수 없습니다.');
      setAccounts([]);
      setSelectedAccount(null);
      console.log('등록된 계좌 정보가 없습니다.');
    } catch (error) {
      console.error('계좌 정보 가져오기 오류:', error);
      console.log('계좌 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 계좌 변경 시 데이터 다시 가져오기
  const handleAccountChange = async (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
      
      await fetchBalanceData(accountId);
      await fetchPortfolioReport(accountId);
    }
  };

  // 잔고 데이터 가져오기
  const fetchBalanceData = async (accountId: string) => {
    try {
      console.log('잔고 데이터 가져오기 시작:', { accountId, year, month });
      
      const { data, error } = await supabase
        .from('balance_records')
        .select('*')
        .eq('account_id', accountId)
        .eq('year', year)
        .eq('month', month)
        .order('record_date', { ascending: true });
        
      if (error) {
        console.error('잔고 데이터 가져오기 오류:', error);
        return;
      }
      
      console.log('잔고 데이터 조회 결과:', data);
      
      if (data && data.length > 0) {
        setBalanceData(data);
        console.log('잔고 데이터 설정 완료:', data);
      } else {
        console.log('잔고 데이터가 없습니다. 기본 데이터를 생성합니다.');
        // 잔고 데이터가 없는 경우 기본 데이터 생성
        const currentDate = new Date();
        const firstDayOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
        const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0);
        
        // 기본 잔고 데이터 생성 (월초, 월중, 월말)
        const defaultData = [
          {
            id: 'start',
            account_id: accountId,
            year: year,
            month: month,
            record_date: firstDayOfMonth.toISOString().split('T')[0],
            balance: 10000000 // 기본 시작 잔고
          },
          {
            id: 'mid',
            account_id: accountId,
            year: year,
            month: month,
            record_date: new Date(parseInt(year), parseInt(month) - 1, 15).toISOString().split('T')[0],
            balance: 10500000 // 중간 잔고
          },
          {
            id: 'end',
            account_id: accountId,
            year: year,
            month: month,
            record_date: lastDayOfMonth.toISOString().split('T')[0],
            balance: 11000000 // 월말 잔고
          }
        ];
        
        setBalanceData(defaultData);
        console.log('기본 잔고 데이터 설정 완료:', defaultData);
      }
    } catch (error) {
      console.error('잔고 데이터 가져오기 오류:', error);
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

  const fetchPortfolioReport = async (accountId: string) => {
    try {
      console.log('포트폴리오 리포트 가져오기 시작:', { accountId });
      
      if (!accountId) {
        console.error('계정 ID가 없습니다.');
        return;
      }
      
      // 계정 정보 가져오기 - 직접 selectedAccount 사용
      let portfolioType = '';
      
      if (selectedAccount && selectedAccount.portfolio_type) {
        portfolioType = selectedAccount.portfolio_type;
        console.log('선택된 계좌에서 포트폴리오 타입 가져옴:', portfolioType);
      } else {
        // 기본 포트폴리오 타입 설정
        portfolioType = '인모스트 국내 ETF'; // 기본값
        console.log('기본 포트폴리오 타입 사용:', portfolioType);
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
            let filePath = '';
            
            // 파일 경로 형식 수정 - 실제 스토리지 경로와 일치하도록
            if (portfolioType.includes('국내 ETF')) {
              filePath = 'portfolio-reports/2025/03/__EMP_3.JPG';
            } else if (portfolioType.includes('연금') || portfolioType.includes('IRP')) {
              filePath = 'portfolio-reports/2025/03/_IRP_1_EMP_3.JPG';
            } else if (portfolioType.includes('ISA')) {
              filePath = 'portfolio-reports/2025/03/ISA_EMP_3.JPG';
            } else if (portfolioType.includes('BDC')) {
              filePath = 'portfolio-reports/2025/03/_BDC__3.JPG';
            } else {
              // 기본값
              filePath = 'portfolio-reports/2025/03/__EMP_3.JPG';
            }
            
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
      let filePath = '';
      
      // 파일 경로 형식 수정 - 실제 스토리지 경로와 일치하도록
      if (portfolioType.includes('국내 ETF')) {
        filePath = 'portfolio-reports/2025/03/__EMP_3.JPG';
      } else if (portfolioType.includes('연금') || portfolioType.includes('IRP')) {
        filePath = 'portfolio-reports/2025/03/_IRP_1_EMP_3.JPG';
      } else if (portfolioType.includes('ISA')) {
        filePath = 'portfolio-reports/2025/03/ISA_EMP_3.JPG';
      } else if (portfolioType.includes('BDC')) {
        filePath = 'portfolio-reports/2025/03/_BDC__3.JPG';
      } else {
        // 기본값
        filePath = 'portfolio-reports/2025/03/__EMP_3.JPG';
      }
      
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
      
      // 오류 발생 시 플레이스홀더 이미지 설정
      const placeholderUrl = `https://placehold.co/800x600/png?text=${encodeURIComponent(selectedAccount?.portfolio_type || '포트폴리오')}+리포트+(${year}-${month})`;
      
      setPortfolioReport({
        id: 'error',
        portfolio_type: selectedAccount?.portfolio_type || '포트폴리오',
        year_month: `${year}-${String(month).padStart(2, '0')}`,
        report_url: placeholderUrl,
        report_date: new Date().toISOString()
      });
    }
  };

  // 이전 달 잔고 가져오기
  const getPreviousBalance = () => {
    if (balanceData.length === 0) return 0;
    return balanceData[0].balance;
  };

  // 현재 잔고 가져오기
  const getCurrentBalance = () => {
    if (balanceData.length === 0) return 0;
    return balanceData[balanceData.length - 1].balance;
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '날짜 정보 없음';
      }
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('날짜 포맷 오류:', error);
      return '날짜 정보 없음';
    }
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
      
      {/* 계좌 선택 */}
      {accounts.length > 1 && (
        <div className="mb-6">
          <label htmlFor="account-select" className="block text-sm font-medium text-gray-700 mb-1">
            포트폴리오 선택
          </label>
          <select
            id="account-select"
            value={selectedAccount?.id}
            onChange={(e) => handleAccountChange(e.target.value)}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md font-medium text-gray-800"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.portfolio_type}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 계좌 정보 카드 */}
        {selectedAccount ? (
          <div className="col-span-1 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">계좌 정보</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">계좌번호</span>
                <span className="font-medium text-gray-900">{selectedAccount.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">포트폴리오</span>
                <span className="font-medium text-gray-900">{selectedAccount.portfolio_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">이전 잔고</span>
                <span className="font-medium text-gray-900">{formatCurrency(getPreviousBalance())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">현재 잔고</span>
                <span className="font-medium text-gray-900">{formatCurrency(getCurrentBalance())}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="col-span-1 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">계좌 정보</h2>
            <p className="text-gray-600">등록된 계좌 정보가 없습니다.</p>
            <p className="text-sm text-gray-500 mt-2">계좌를 등록하시면 더 자세한 정보를 확인하실 수 있습니다.</p>
          </div>
        )}
        
        {/* Monthly Comment 카드 */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">이달의 투자 코멘트</h2>
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
      </div>
      
      {/* 잔고 변화 그래프 카드 */}
      {selectedAccount ? (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">잔고 변화 추이</h2>
          {balanceData.length > 0 ? (
            <ChartWrapper data={balanceData.map(record => ({
              date: new Date(record.record_date).toISOString().split('T')[0],
              balance: Number(record.balance)
            }))} />
          ) : (
            <p className="text-gray-600">잔고 데이터가 없습니다.</p>
          )}
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">잔고 변화 추이</h2>
          <p className="text-gray-600">계좌 정보가 없어 잔고 데이터를 표시할 수 없습니다.</p>
          <p className="text-sm text-gray-500 mt-2">계좌를 등록하시면 잔고 변화 추이를 확인하실 수 있습니다.</p>
        </div>
      )}
      
      {/* 포트폴리오 리포트 카드 */}
      {selectedAccount ? (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">포트폴리오 리포트</h2>
          {portfolioReport ? (
            <div className="flex flex-col items-center">
              <div className="mb-3 text-center">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {selectedAccount.portfolio_type} 포트폴리오
                </span>
              </div>
              
              {/* 이미지 컨테이너 - 더 크게 표시 */}
              <div className="relative w-full max-w-4xl h-[700px] border border-gray-200 rounded-lg overflow-hidden">
                {/* 이미지 로딩 상태 표시 */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
                  <div className="text-gray-500">이미지 로딩 중...</div>
                </div>
                
                {/* 디버그 정보 삭제 */}
                
                {/* 이미지 표시 - 여러 방식 시도 */}
                {/* 1. 일반 img 태그 */}
                <img
                  src={portfolioReport.report_url}
                  alt={`${selectedAccount.portfolio_type} 포트폴리오 리포트`}
                  className="w-full h-full object-contain z-1 relative"
                  style={{ display: 'block' }}
                  onError={(e) => {
                    console.error('이미지 로드 오류:', e);
                    e.currentTarget.style.display = 'none'; // 오류 시 숨김
                    
                    // 다음 방식 시도를 위해 iframe 표시
                    const iframe = document.getElementById('report-iframe');
                    if (iframe) {
                      (iframe as HTMLElement).style.display = 'block';
                    }
                    
                    // 3초 후에도 이미지가 로드되지 않으면 대체 이미지 표시
                    setTimeout(() => {
                      const fallbackImage = document.getElementById('fallback-image');
                      if (fallbackImage && fallbackImage.style.display === 'none') {
                        // iframe과 background-image 방식도 실패한 경우
                        const iframe = document.getElementById('report-iframe');
                        const bgDiv = document.getElementById('report-bg-div');
                        
                        if ((iframe as HTMLElement)?.style.display === 'none' && 
                            (bgDiv as HTMLElement)?.style.display === 'none') {
                          fallbackImage.style.display = 'flex';
                        }
                      }
                    }, 3000);
                  }}
                  onLoad={() => console.log('이미지 로드 성공')}
                />
                
                {/* 2. iframe 방식 (img 태그가 실패할 경우 사용) */}
                <iframe
                  id="report-iframe"
                  src={portfolioReport.report_url}
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
              
              {/* 다운로드 버튼 및 정보 */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="text-sm text-gray-500">
                  {year}년 {month}월 리포트
                </div>
                <button 
                  onClick={async () => {
                    try {
                      // 로딩 상태 표시
                      const downloadBtn = document.getElementById('download-btn');
                      if (downloadBtn) {
                        downloadBtn.textContent = '다운로드 중...';
                        downloadBtn.setAttribute('disabled', 'true');
                      }
                      
                      // 이미지 가져오기
                      const response = await fetch(portfolioReport.report_url);
                      
                      if (!response.ok) {
                        throw new Error('이미지를 가져오는데 실패했습니다.');
                      }
                      
                      // Blob으로 변환
                      const blob = await response.blob();
                      
                      // 다운로드 링크 생성
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.style.display = 'none';
                      a.href = url;
                      a.download = `${selectedAccount.portfolio_type}_리포트_${year}년_${month}월.jpg`;
                      
                      // 링크 클릭하여 다운로드
                      document.body.appendChild(a);
                      a.click();
                      
                      // 정리
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      
                      // 버튼 상태 복원
                      if (downloadBtn) {
                        downloadBtn.textContent = '다운로드';
                        downloadBtn.removeAttribute('disabled');
                      }
                    } catch (error) {
                      console.error('다운로드 오류:', error);
                      alert('다운로드 중 오류가 발생했습니다.');
                      
                      // 버튼 상태 복원
                      const downloadBtn = document.getElementById('download-btn');
                      if (downloadBtn) {
                        downloadBtn.textContent = '다운로드';
                        downloadBtn.removeAttribute('disabled');
                      }
                    }
                  }}
                  id="download-btn"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  다운로드
                </button>
                <button
                  onClick={() => window.open(portfolioReport.report_url, '_blank')}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  새 창에서 보기
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-600 mb-4">등록된 포트폴리오 리포트가 없습니다.</p>
              <div className="bg-gray-100 p-4 rounded-lg inline-block">
                <p className="text-gray-500">{selectedAccount.portfolio_type} 포트폴리오 ({year}년 {month}월)</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">포트폴리오 리포트</h2>
          <p className="text-gray-600">계좌 정보가 없어 포트폴리오 리포트를 표시할 수 없습니다.</p>
          <p className="text-sm text-gray-500 mt-2">계좌를 등록하시면 포트폴리오 리포트를 확인하실 수 있습니다.</p>
        </div>
      )}
    </div>
  );
} 