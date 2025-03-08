'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import ChartWrapper from '@/components/chart-wrapper';

interface PageProps {
  params: {
    year: string;
    month: string;
  };
}

export default function MonthlyReportDetail({ params }: PageProps) {
  const { year, month } = params;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [balanceData, setBalanceData] = useState<any[]>([]);
  const [monthlyComment, setMonthlyComment] = useState<any>(null);
  const [portfolioReport, setPortfolioReport] = useState<any>(null);
  const router = useRouter();

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // 로그인하지 않은 경우 로그인 페이지로 이동
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // 월간 리포트 데이터 가져오기
        const { data: reportData, error: reportError } = await supabase
          .from('monthly_reports')
          .select('*')
          .eq('year', year)
          .eq('month', month)
          .single();
          
        if (reportError) {
          console.error('월간 리포트 데이터 가져오기 오류:', reportError);
          setError('리포트를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
        
        setReport(reportData);
        
        // 계좌 데이터 가져오기
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);
          
        if (accountsError) {
          console.error('계좌 데이터 가져오기 오류:', accountsError);
          setError('계좌 정보를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
          return;
        }
        
        if (accountsData && accountsData.length > 0) {
          setAccounts(accountsData);
          setSelectedAccount(accountsData[0]);
          
          // 선택된 계좌의 잔고 데이터 가져오기
          await fetchBalanceData(accountsData[0].id);
          
          // 월간 코멘트 가져오기
          await fetchMonthlyComment();
          
          // 포트폴리오 리포트 가져오기
          await fetchPortfolioReport(accountsData[0].id);
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router, year, month]);

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
      
      setBalanceData(data || []);
    } catch (error) {
      console.error('잔고 데이터 가져오기 오류:', error);
    }
  };

  // 월간 코멘트 가져오기
  const fetchMonthlyComment = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_comments')
        .select('*')
        .eq('year', year)
        .eq('month', month)
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

  // 포트폴리오 리포트 가져오기
  const fetchPortfolioReport = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolio_reports')
        .select('*')
        .eq('account_id', accountId)
        .eq('year', year)
        .eq('month', month)
        .single();
        
      if (error) {
        console.error('포트폴리오 리포트 가져오기 오류:', error);
        return;
      }
      
      setPortfolioReport(data);
    } catch (error) {
      console.error('포트폴리오 리포트 가져오기 오류:', error);
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
            계좌 선택
          </label>
          <select
            id="account-select"
            value={selectedAccount?.id}
            onChange={(e) => handleAccountChange(e.target.value)}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_number} ({account.portfolio_type})
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 계좌 정보 카드 */}
        {selectedAccount && (
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
      
      {/* 포트폴리오 리포트 카드 */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">포트폴리오 리포트</h2>
        {portfolioReport ? (
          <div className="flex justify-center">
            <div className="relative w-full max-w-2xl h-[600px]">
              <Image
                src={portfolioReport.report_url}
                alt={`${selectedAccount?.portfolio_type} 포트폴리오 리포트`}
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        ) : (
          <p className="text-gray-600">등록된 포트폴리오 리포트가 없습니다.</p>
        )}
      </div>
    </div>
  );
} 