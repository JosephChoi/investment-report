'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, FileText } from 'lucide-react';
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
          setError('로그인이 필요합니다.');
          setLoading(false);
          return;
        }
        
        setUser(user);
        
        // 사용자의 계좌 정보 가져오기
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*, portfolio:portfolio_types(id, name)')
          .eq('user_id', user.id);
        
        if (accountsError) throw accountsError;
        
        if (accountsData && accountsData.length > 0) {
          setAccounts(accountsData);
          setSelectedAccount(accountsData[0]);
          
          // 선택된 계좌의 포트폴리오 리포트 가져오기
          await fetchPortfolioReport(accountsData[0].portfolio_type_id);
        }
        
        // 최신 월간 코멘트 가져오기
        await fetchMonthlyComment();
        
        // 월간 리포트 데이터 가져오기
        await fetchMonthlyReports();
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // 월간 리포트 데이터 가져오기
  const fetchMonthlyReports = async () => {
    try {
      // 실제 데이터 가져오기
      const { data, error } = await supabase
        .from('monthly_reports')
        .select('*')
        .order('year_month', { ascending: false });
        
      if (error) {
        console.error('월간 리포트 데이터 가져오기 오류:', error);
        setError('월간 리포트 데이터를 불러오는 중 오류가 발생했습니다.');
        return;
      }
      
      // 실제 데이터 사용
      if (data && data.length > 0) {
        const realReports = data.map(item => {
          const [year, month] = (item.year_month || '').split('-');
          return {
            year: parseInt(year),
            month: parseInt(month),
            title: item.title || `${year}년 ${month}월 리포트`,
            description: item.description || '월간 투자 현황 및 포트폴리오 리포트입니다.',
            image_url: item.image_url || `https://placehold.co/800x400/png?text=${year}년+${month}월+리포트`,
            year_month: item.year_month
          };
        });
        setReports(realReports);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('월간 리포트 데이터 처리 오류:', error);
      setError('월간 리포트 데이터를 처리하는 중 오류가 발생했습니다.');
    }
  };

  // 계좌 변경 시 데이터 다시 가져오기
  const handleAccountChange = async (accountId: string) => {
    try {
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
      
      // 포트폴리오 리포트 가져오기
      await fetchPortfolioReport(account.portfolio_type_id);
      
      setLoading(false);
    } catch (error) {
      console.error('계좌 변경 중 오류 발생:', error);
      setError('계좌 정보를 변경하는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 포트폴리오 리포트 가져오기
  const fetchPortfolioReport = async (portfolioTypeId: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolio_reports')
        .select('*')
        .eq('portfolio_type_id', portfolioTypeId)
        .order('report_date', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      // 데이터가 없는 경우 기존 portfolio_type 필드로 시도
      if (!data || data.length === 0) {
        console.log('portfolio_type_id로 리포트를 찾을 수 없어 portfolio_type으로 시도합니다.');
        
        // 선택된 계정의 portfolio_type 가져오기
        const portfolioType = selectedAccount?.portfolio_type;
        
        if (portfolioType) {
          const { data: legacyData, error: legacyError } = await supabase
            .from('portfolio_reports')
            .select('*')
            .eq('portfolio_type', portfolioType)
            .order('report_date', { ascending: false })
            .limit(1);
            
          if (legacyError) throw legacyError;
          
          setPortfolioReport(legacyData && legacyData.length > 0 ? legacyData[0] : null);
          return;
        }
      }
      
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
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">월간 투자 리포트</h1>
        <p className="text-gray-600">매월 업데이트되는 투자 현황 및 포트폴리오 분석 리포트입니다.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.length > 0 ? (
          reports.map((report) => (
            <MonthlyReportCard
              key={`${report.year}-${report.month}`}
              year={report.year}
              month={report.month}
              title={report.title || `${report.year}년 ${report.month}월 리포트`}
              description={report.description || '월간 투자 현황 및 포트폴리오 리포트입니다.'}
              imageUrl={report.image_url || `https://placehold.co/800x400/png?text=${report.year}년+${report.month}월+리포트`}
            />
          ))
        ) : (
          <div className="col-span-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <FileText className="w-12 h-12 text-gray-300" />
              <p className="text-gray-600 text-lg">아직 등록된 월간 리포트가 없습니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 