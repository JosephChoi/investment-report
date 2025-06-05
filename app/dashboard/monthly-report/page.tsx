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
  const router = useRouter();

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('인증 상태 확인 시작...');
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        
        if (sessionError) {
          console.error('세션 오류:', sessionError);
          
          // 로그인 페이지로 리다이렉트
          console.log('로그인 페이지로 이동합니다...');
          router.push('/login?redirect=monthly-report');
          return;
        }
        
        if (!user) {
          console.log('로그인되지 않은 사용자, 로그인 페이지로 리다이렉트');
          router.push('/login');
          return;
        }
        
        console.log('로그인된 사용자:', user.id);
        setUser(user);
        
        try {
          await fetchUserData(user);
        } catch (fetchError) {
          console.error('사용자 데이터 가져오기 실패:', fetchError);
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setError('인증 확인 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // 임시 데이터 설정 (API 호출 실패 시 백업)
  useEffect(() => {
    // 10초 후에도 데이터가 로드되지 않으면 샘플 데이터 표시
    const timeout = setTimeout(() => {
      if (reports.length === 0 && loading) {
        console.log('시간 초과로 샘플 데이터 표시');
        
        // 샘플 리포트 데이터
        const sampleReports = [
          {
            year: 2025,
            month: 3,
            title: '2025년 3월 샘플 리포트',
            description: '월간 투자 현황 및 포트폴리오 리포트입니다.',
            image_url: 'https://placehold.co/800x400/png?text=2025년+3월+샘플+리포트',
            year_month: '2025-03'
          },
          {
            year: 2025,
            month: 2,
            title: '2025년 2월 샘플 리포트',
            description: '월간 투자 현황 및 포트폴리오 리포트입니다.',
            image_url: 'https://placehold.co/800x400/png?text=2025년+2월+샘플+리포트',
            year_month: '2025-02'
          },
          {
            year: 2025,
            month: 1,
            title: '2025년 1월 샘플 리포트',
            description: '월간 투자 현황 및 포트폴리오 리포트입니다.',
            image_url: 'https://placehold.co/800x400/png?text=2025년+1월+샘플+리포트',
            year_month: '2025-01'
          }
        ];
        
        setReports(sampleReports);
        setLoading(false);
        
        // 오류가 있다면 경고로 표시
        if (error) {
          console.warn('API 오류가 있지만 샘플 데이터로 계속 진행합니다:', error);
        }
      }
    }, 10000); // 10초
    
    return () => clearTimeout(timeout);
  }, [loading, reports.length, error]);

  // 오류 응답 처리를 위한 헬퍼 함수
  const handleApiError = async (response: Response, apiName: string) => {
    try {
      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          console.error(`${apiName} API 오류:`, errorData);
          return errorData;
        } catch (jsonError) {
          console.error(`${apiName} API 응답 파싱 오류:`, jsonError);
          return { 
            success: false, 
            error: `응답을 파싱할 수 없습니다: ${response.status} ${response.statusText}`,
            details: String(jsonError)
          };
        }
      } else {
        console.error(`${apiName} API 오류: 응답이 JSON 형식이 아닙니다. 상태 코드: ${response.status}`);
        let textContent = '';
        try {
          textContent = await response.text();
          console.error(`${apiName} API 응답 텍스트:`, textContent.slice(0, 200));
        } catch (textError) {
          console.error(`${apiName} API 응답 텍스트 읽기 실패:`, textError);
        }
        return { 
          success: false, 
          error: `응답이 JSON 형식이 아닙니다. 상태 코드: ${response.status}`,
          details: textContent.slice(0, 200) 
        };
      }
    } catch (parseError) {
      console.error(`${apiName} API 오류 파싱 실패:`, parseError);
      return { 
        success: false, 
        error: `응답 파싱 오류: ${response.status} ${response.statusText}`,
        details: String(parseError)
      };
    }
  };

  // API 요청 함수 추가 - 타임아웃과 오류 처리를 포함
  const fetchWithTimeout = async (url: string, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  // 사용자 데이터 가져오기
  const fetchUserData = async (user: any) => {
    try {
      console.log('사용자 데이터 가져오기 시작...');
      
      // API 호출로 모든 데이터 가져오기
      try {
        // 각 API를 개별적으로 호출하여 오류 처리
        let hasErrors = false;
        
        // 월간 리포트 가져오기 (최우선 - 가장 중요한 데이터)
        console.log('월간 리포트 가져오기 시작');
        try {
          // 인증 토큰 가져오기
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            console.error('인증 세션 가져오기 오류:', sessionError);
            hasErrors = true;
            
            // 샘플 데이터 설정 - 오류가 있어도 UI는 표시
            const sampleReports = [
              {
                year: 2025,
                month: 3,
                title: '2025년 3월 리포트 (인증 오류)',
                description: '인증 오류로 샘플 데이터가 표시됩니다.',
                image_url: 'https://placehold.co/800x400/png?text=2025년+3월+샘플+리포트',
                year_month: '2025-03'
              },
              {
                year: 2025,
                month: 2,
                title: '2025년 2월 리포트 (인증 오류)',
                description: '인증 오류로 샘플 데이터가 표시됩니다.',
                image_url: 'https://placehold.co/800x400/png?text=2025년+2월+샘플+리포트',
                year_month: '2025-02'
              }
            ];
            setReports(sampleReports);
            setError('인증 오류가 발생했습니다. 샘플 데이터가 표시됩니다. 다시 로그인해주세요.');
            
            // 인증 오류 시 로그인 페이지로 이동
            setTimeout(() => {
              router.push('/login?redirect=monthly-report');
            }, 3000); // 3초 후 리다이렉트
            
            return;
          }
          
          // API 호출 시 인증 토큰 추가
          const authHeader = {
            'Authorization': `Bearer ${session.access_token}`
          };
          
          const monthlyReportsRes = await fetch('/api/monthly-report/bypass', { 
            method: 'GET',
            cache: 'no-cache',
            headers: authHeader
          });
          
          if (monthlyReportsRes.ok) {
            try {
              const monthlyReportsData = await monthlyReportsRes.json();
              if (monthlyReportsData.success && monthlyReportsData.data) {
                const realReports = monthlyReportsData.data.map((item: any) => {
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
                console.log('월간 리포트 데이터 설정 완료:', realReports.length);
              }
            } catch (parseError) {
              console.error('월간 리포트 데이터 파싱 오류:', parseError);
              hasErrors = true;
            }
          } else {
            console.error('월간 리포트 API 응답 상태 코드:', monthlyReportsRes.status);
            hasErrors = true;
          }
        } catch (monthlyReportsError) {
          console.error('월간 리포트 API 호출 예외:', monthlyReportsError);
          hasErrors = true;
        }
        
        // 세션 가져오기 (이미 위에서 가져오지 못했다면 여기서는 건너뜀)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('인증 세션이 없습니다. 다른 API 호출을 건너뜁니다.');
          setLoading(false);
          return;
        }
        
        // API 호출 시 인증 토큰 추가
        const authHeader = {
          'Authorization': `Bearer ${session.access_token}`
        };
        
        // 다른 API 호출은 비동기로 진행하고 오류가 있어도 UI 로딩 완료
        Promise.all([
          // 계정 정보 가져오기
          (async () => {
            try {
              console.log('계정 정보 가져오기 시작');
              const accountsRes = await fetch(`/api/user-accounts/bypass?userId=${user.id}`, { 
                method: 'GET',
                cache: 'no-cache',
                headers: authHeader
              });
              
              if (accountsRes.ok) {
                const accountsData = await accountsRes.json();
                if (accountsData.success && accountsData.data) {
                  setAccounts(accountsData.data);
                  if (accountsData.data.length > 0) {
                    setSelectedAccount(accountsData.data[0]);
                    
                    // 포트폴리오 리포트 가져오기 (계정 정보가 있을 경우)
                    if (accountsData.data[0].portfolio_type_id) {
                      try {
                        console.log('포트폴리오 리포트 가져오기 시작');
                        const portfolioRes = await fetch(`/api/portfolio-report/bypass?portfolioTypeId=${accountsData.data[0].portfolio_type_id}`, { 
                          method: 'GET',
                          cache: 'no-cache',
                          headers: authHeader
                        });
                        
                        if (portfolioRes.ok) {
                          const portfolioData = await portfolioRes.json();
                          if (portfolioData.success && portfolioData.data && portfolioData.data.length > 0) {
                            setPortfolioReport(portfolioData.data[0]);
                            console.log('포트폴리오 리포트 데이터 설정 완료');
                          }
                        } else {
                          console.error('포트폴리오 리포트 API 오류 상태 코드:', portfolioRes.status);
                        }
                      } catch (portfolioError) {
                        console.error('포트폴리오 데이터 처리 오류:', portfolioError);
                      }
                    }
                  }
                  console.log('계정 정보 설정 완료:', accountsData.data.length);
                }
              } else {
                console.error('계정 정보 API 오류 상태 코드:', accountsRes.status);
              }
            } catch (accountsError) {
              console.error('계정 정보 API 호출 예외:', accountsError);
            }
          })(),
          
          // 월간 코멘트 가져오기
          (async () => {
            try {
              console.log('월간 코멘트 가져오기 시작');
              const monthlyCommentRes = await fetch('/api/monthly-comment/bypass', { 
                method: 'GET',
                cache: 'no-cache',
                headers: authHeader
              });
              
              if (monthlyCommentRes.ok) {
                const monthlyCommentData = await monthlyCommentRes.json();
                if (monthlyCommentData.success) {
                  setMonthlyComment(monthlyCommentData.data);
                  console.log('월간 코멘트 데이터 설정 완료');
                }
              } else {
                console.error('월간 코멘트 API 오류 상태 코드:', monthlyCommentRes.status);
              }
            } catch (monthlyCommentError) {
              console.error('월간 코멘트 API 호출 예외:', monthlyCommentError);
            }
          })()
        ]).catch(error => {
          console.error('병렬 API 호출 오류:', error);
        }).finally(() => {
          // 로딩 완료
          setLoading(false);
        });
        
        // 오류가 있는 경우 표시, 하지만 로딩은 완료
        if (hasErrors) {
          setError('일부 데이터를 가져오는 중 문제가 발생했습니다. 데이터가 일부만 표시될 수 있습니다.');
        }
        
      } catch (apiError) {
        console.error('API 호출 오류:', apiError);
        setError('데이터를 가져오는 중 오류가 발생했습니다. 새로고침을 시도하거나 나중에 다시 시도해주세요.');
        setLoading(false);
      }
    } catch (error) {
      console.error('사용자 데이터 가져오기 오류:', error);
      if (error instanceof Error) {
        console.error('오류 메시지:', error.message);
        console.error('오류 스택:', error.stack);
      }
      setError('사용자 데이터를 가져오는 중 오류가 발생했습니다.');
      setLoading(false);
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
      try {
        if (account.portfolio_type_id) {
          console.log('선택된 계좌의 포트폴리오 리포트 가져오기 시작');
          try {
            const portfolioRes = await fetch(`/api/portfolio-report/bypass?portfolioTypeId=${account.portfolio_type_id}`, {
              method: 'GET',
              cache: 'no-cache'
            });
            
            if (portfolioRes.ok) {
              const portfolioData = await portfolioRes.json();
              if (portfolioData.success && portfolioData.data && portfolioData.data.length > 0) {
                setPortfolioReport(portfolioData.data[0]);
                console.log('포트폴리오 리포트 데이터 설정 완료');
              } else {
                setPortfolioReport(null);
                console.log('해당 계좌의 포트폴리오 리포트가 없습니다.');
              }
            } else {
              console.error('포트폴리오 리포트 API 오류 상태 코드:', portfolioRes.status);
              setError('포트폴리오 리포트를 가져오는 중 문제가 발생했습니다.');
            }
          } catch (fetchError) {
            console.error('포트폴리오 리포트 API 호출 예외:', fetchError);
            setError('포트폴리오 리포트를 가져오는 중 네트워크 오류가 발생했습니다.');
          }
        } else {
          setPortfolioReport(null);
          console.log('계좌에 포트폴리오 타입 ID가 없습니다.');
        }
      } catch (portfolioError) {
        console.error('포트폴리오 리포트 처리 오류:', portfolioError);
        setError('포트폴리오 리포트를 처리하는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('계좌 변경 중 오류 발생:', error);
      setError('계좌 정보를 변경하는 중 오류가 발생했습니다.');
      setLoading(false);
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

  // 데이터 로딩 완료 처리 함수 추가
  const completeDataLoading = () => {
    setLoading(false);
  };

  // fetchUserData 함수 마지막에 로딩 완료 처리 추가
  useEffect(() => {
    // 모든 데이터 로딩이 끝나면 로딩 상태 해제
    if (user) {
      completeDataLoading();
    }
  }, [user, reports, portfolioReport, monthlyComment]);

  // 전체 페이지 로딩 중일 때는 로딩 UI를 보여주지 않고,
  // 이제 데이터 로딩 중 상태는 아래의 리턴문에서 처리합니다.
  if (loading && !user) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">사용자 정보를 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 심각한 오류면서 데이터가 없을 때만 오류 페이지 표시
  if (error && reports.length === 0) {
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
          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-all duration-300 transform hover:-translate-x-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md hover:shadow-lg">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>대시보드로 돌아가기</span>
          </Link>
        </div>
        
        {error && (
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50/50 p-6 rounded-xl border border-yellow-200 backdrop-blur-sm shadow-lg">
            <p className="text-yellow-800 font-medium">{error}</p>
            <p className="text-sm text-yellow-700 mt-2">
              일부 데이터가 표시되지 않을 수 있지만, 사용 가능한 정보는 정상적으로 표시됩니다.
            </p>
          </div>
        )}
        
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">월간 투자 리포트</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">매월 업데이트되는 투자 현황 및 포트폴리오 분석 리포트입니다.</p>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {loading ? (
          <div className="col-span-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-pulse w-12 h-12 bg-gray-200 rounded-full"></div>
              <p className="text-gray-600 text-lg">데이터를 불러오는 중입니다...</p>
            </div>
          </div>
        ) : reports.length > 0 ? (
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
              <p className="text-gray-600 text-lg">월간 리포트 가져오는 중...</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
} 