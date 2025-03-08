'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function TestContractDate() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [hasContractDateColumn, setHasContractDateColumn] = useState(false);
  
  useEffect(() => {
    const checkContractDate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. 계좌 테이블 구조 확인
        const { data: accountColumns, error: columnsError } = await supabase
          .from('accounts')
          .select('*')
          .limit(1);
          
        if (columnsError) {
          throw new Error('계좌 정보를 가져오는 중 오류가 발생했습니다.');
        }
        
        // 계좌 데이터가 있는지 확인
        if (accountColumns && accountColumns.length > 0) {
          // contract_date 컬럼이 있는지 확인
          setHasContractDateColumn('contract_date' in accountColumns[0]);
        }
        
        // 2. 계좌 데이터 가져오기
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .limit(20);
          
        if (accountsError) {
          throw new Error('계좌 정보를 가져오는 중 오류가 발생했습니다.');
        }
        
        setAccounts(accountsData || []);
      } catch (error: any) {
        console.error('계약일 데이터 확인 오류:', error);
        setError(error.message || '계약일 데이터 확인 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    checkContractDate();
  }, []);
  
  // 날짜 포맷 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '정보 없음';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '날짜 형식 오류';
    }
  };
  
  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">계약일 데이터 확인</h1>
      
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
          대시보드로 돌아가기
        </Link>
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="p-4 bg-white rounded-md shadow-sm">
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-md shadow-sm">
            <h2 className="text-xl font-semibold mb-4">테이블 구조</h2>
            
            {hasContractDateColumn ? (
              <div className="p-3 bg-green-100 text-green-700 rounded-md mb-4">
                <p className="font-medium">계약일 컬럼이 존재합니다.</p>
              </div>
            ) : (
              <div className="p-3 bg-yellow-100 text-yellow-700 rounded-md mb-4">
                <p className="font-medium">계약일 컬럼이 존재하지 않습니다.</p>
                <p className="text-sm mt-1">Supabase 대시보드에서 다음 SQL을 실행하세요:</p>
                <pre className="text-sm mt-2 bg-gray-50 p-2 rounded">
                  ALTER TABLE accounts ADD COLUMN contract_date TIMESTAMP WITH TIME ZONE;
                </pre>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-white rounded-md shadow-sm">
            <h2 className="text-xl font-semibold mb-4">계좌 데이터</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-600">총 계좌 수</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
              
              <div className="p-3 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-600">계약일 있는 계좌 수</p>
                <p className="text-2xl font-bold">
                  {accounts.filter(account => account.contract_date).length}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-4">계좌 목록</h3>
              
              {accounts.length > 0 ? (
                <div className="overflow-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 text-left">계좌번호</th>
                        <th className="py-2 px-4 text-left">포트폴리오</th>
                        <th className="py-2 px-4 text-left">최초계약일</th>
                        <th className="py-2 px-4 text-left">생성일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account, index) => (
                        <tr key={account.id || index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-2 px-4">{account.account_number}</td>
                          <td className="py-2 px-4">{account.portfolio_type}</td>
                          <td className="py-2 px-4">
                            {account.contract_date ? (
                              <span className="text-green-600">{formatDate(account.contract_date)}</span>
                            ) : (
                              <span className="text-red-500">정보 없음</span>
                            )}
                          </td>
                          <td className="py-2 px-4">{formatDate(account.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">등록된 계좌 정보가 없습니다.</p>
              )}
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-md shadow-sm">
            <h2 className="text-xl font-semibold mb-4">다음 단계</h2>
            
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <span className="font-medium">계약일 컬럼 추가:</span> 
                {hasContractDateColumn ? (
                  <span className="text-green-600 ml-2">완료</span>
                ) : (
                  <span className="text-red-500 ml-2">필요</span>
                )}
              </li>
              <li>
                <span className="font-medium">고객 데이터 업로드:</span> 
                <Link href="/admin" className="text-blue-600 hover:text-blue-800 ml-2">
                  관리자 페이지로 이동
                </Link>
              </li>
              <li>
                <span className="font-medium">대시보드 확인:</span> 
                <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 ml-2">
                  대시보드로 이동
                </Link>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
} 