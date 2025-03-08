'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import ChartWrapper from '@/components/chart-wrapper';
import PortfolioReportWrapper from '@/components/portfolio-report-wrapper';
import Image from 'next/image';
import MonthlyReportCard from '@/app/components/MonthlyReportCard';

export default function MonthlyReport() {
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [balanceData, setBalanceData] = useState<any[]>([]);
  const [portfolioReport, setPortfolioReport] = useState<any>(null);
  const [monthlyComment, setMonthlyComment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [isTestMode, setIsTestMode] = useState(false);
  const router = useRouter();

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // 테스트 모드 활성화 (실제 배포 시 제거 필요)
          console.log('로그인하지 않았습니다. 테스트 모드로 전환합니다.');
          setIsTestMode(true);
          
          // 테스트 모드에서는 월간 리포트 데이터만 가져옵니다.
          await fetchMonthlyReports();
          setLoading(false);
          return;
        }
        
        setUser(user);
        
        // 사용자의 계좌 정보 가져오기
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);
        
        if (accountsError) throw accountsError;
        
        if (accountsData && accountsData.length > 0) {
          setAccounts(accountsData);
          setSelectedAccount(accountsData[0]);
          
          // 선택된 계좌의 잔고 데이터 가져오기
          await fetchBalanceData(accountsData[0].id);
          
          // 선택된 계좌의 포트폴리오 리포트 가져오기
          await fetchPortfolioReport(accountsData[0].portfolio_type);
        }
        
        // 최신 월간 코멘트 가져오기
        await fetchMonthlyComment();
        
        // 월간 리포트 데이터 가져오기
        await fetchMonthlyReports();
      } catch (error) {
        console.error('인증 확인 오류:', error);
        // 테스트 모드 활성화 (실제 배포 시 제거 필요)
        console.log('오류 발생. 테스트 모드로 전환합니다.');
        setIsTestMode(true);
        await fetchMonthlyReports();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // 월간 리포트 데이터 가져오기
  const fetchMonthlyReports = async () => {
    try {
      // 테스트용 더미 데이터 생성
      const currentDate = new Date();
      const dummyReports = [
        {
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
          title: `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 리포트`,
          description: '월간 투자 현황 및 포트폴리오 리포트입니다.',
          image_url: '/images/report-placeholder.jpg'
        },
        {
          year: currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear(),
          month: currentDate.getMonth() === 0 ? 12 : currentDate.getMonth(),
          title: `${currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear()}년 ${currentDate.getMonth() === 0 ? 12 : currentDate.getMonth()}월 리포트`,
          description: '월간 투자 현황 및 포트폴리오 리포트입니다.',
          image_url: '/images/report-placeholder.jpg'
        }
      ];
      
      // 실제 데이터 가져오기 시도
      const { data, error } = await supabase
        .from('monthly_comments')
        .select('year_month')
        .order('comment_date', { ascending: false });
        
      if (error) {
        console.error('월간 리포트 데이터 가져오기 오류:', error);
        setReports(dummyReports); // 오류 시 더미 데이터 사용
        return;
      }
      
      // 실제 데이터가 있으면 사용, 없으면 더미 데이터 사용
      if (data && data.length > 0) {
        const realReports = data.map(item => {
          const [year, month] = item.year_month.split('-');
          return {
            year: parseInt(year),
            month: parseInt(month),
            title: `${year}년 ${month}월 리포트`,
            description: '월간 투자 현황 및 포트폴리오 리포트입니다.',
            year_month: item.year_month
          };
        });
        setReports(realReports);
      } else {
        setReports(dummyReports);
      }
    } catch (error) {
      console.error('월간 리포트 데이터 처리 오류:', error);
      // 오류 발생 시 더미 데이터 사용
      const currentDate = new Date();
      setReports([
        {
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
          title: `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 리포트`,
          description: '월간 투자 현황 및 포트폴리오 리포트입니다.',
          image_url: '/images/report-placeholder.jpg'
        }
      ]);
    }
  };

  // 계좌 변경 시 데이터 다시 가져오기
  const handleAccountChange = async (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
      await fetchBalanceData(account.id);
      await fetchPortfolioReport(account.portfolio_type);
    }
  };

  // 잔고 데이터 가져오기
  const fetchBalanceData = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('balance_records')
        .select('*')
        .eq('account_id', accountId)
        .order('record_date', { ascending: true });
      
      if (error) throw error;
      
      setBalanceData(data || []);
    } catch (error: any) {
      console.error('잔고 데이터 로딩 오류:', error);
      setError('잔고 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 포트폴리오 리포트 가져오기
  const fetchPortfolioReport = async (portfolioType: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolio_reports')
        .select('*')
        .eq('portfolio_type', portfolioType)
        .order('report_date', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      setPortfolioReport(data && data.length > 0 ? data[0] : null);
    } catch (error: any) {
      console.error('포트폴리오 리포트 로딩 오류:', error);
      setError('포트폴리오 리포트를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 월간 코멘트 가져오기
  const fetchMonthlyComment = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_comments')
        .select('*')
        .order('comment_date', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      setMonthlyComment(data && data.length > 0 ? data[0] : null);
    } catch (error: any) {
      console.error('월간 코멘트 로딩 오류:', error);
      setError('월간 코멘트를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 현재 잔고와 이전 잔고 계산
  const getCurrentBalance = () => {
    if (balanceData.length === 0) return 0;
    return Number(balanceData[balanceData.length - 1].balance);
  };

  const getPreviousBalance = () => {
    if (balanceData.length <= 1) return 0;
    return Number(balanceData[balanceData.length - 2].balance);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error && !isTestMode) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-gray-700 hover:text-gray-900">
            <ChevronLeft className="w-4 h-4 mr-2" />
            <span>대시보드로 돌아가기</span>
          </Link>
        </div>
        
        <div className="bg-red-100 p-6 rounded-xl shadow-sm border border-red-200 text-red-700">
          <h2 className="text-xl font-semibold mb-2">오류 발생</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>대시보드로 돌아가기</span>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6 text-gray-900">월간 투자 리포트</h1>
      
      {isTestMode && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800">
          <p className="font-medium">테스트 모드 활성화됨</p>
          <p className="text-sm">로그인하지 않은 상태에서 테스트 목적으로 데이터를 표시합니다. 실제 배포 시 이 모드는 비활성화됩니다.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.length > 0 ? (
          reports.map((report) => (
            <MonthlyReportCard
              key={`${report.year}-${report.month}`}
              year={report.year}
              month={report.month}
              title={report.title || `${report.year}년 ${report.month}월 리포트`}
              description={report.description || '월간 투자 현황 및 포트폴리오 리포트입니다.'}
              imageUrl={report.image_url || '/images/report-placeholder.jpg'}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600 text-lg">아직 등록된 월간 리포트가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 