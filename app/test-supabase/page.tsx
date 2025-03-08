'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabasePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [directTestResult, setDirectTestResult] = useState<any>(null);
  
  // API를 통한 테스트
  useEffect(() => {
    const fetchTestResult = async () => {
      try {
        const response = await fetch('/api/test-supabase');
        const data = await response.json();
        setTestResult(data);
      } catch (error: any) {
        setError(`API 테스트 오류: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestResult();
  }, []);
  
  // 직접 Supabase 클라이언트를 사용한 테스트
  const runDirectTest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. 직접 테이블 목록 확인 (하드코딩)
      const tablesToCheck = ['users', 'accounts', 'balance_records', 'monthly_comments', 'portfolio_reports'];
      const tableDetails = [];
      
      for (const tableName of tablesToCheck) {
        try {
          // 테이블에서 데이터 샘플 가져오기
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (sampleError) {
            console.error(`${tableName} 샘플 데이터 가져오기 오류:`, sampleError);
            tableDetails.push({
              tableName,
              exists: false,
              error: sampleError.message
            });
          } else {
            tableDetails.push({
              tableName,
              exists: true,
              sampleData: sampleData || []
            });
          }
        } catch (tableError: any) {
          console.error(`${tableName} 테이블 테스트 오류:`, tableError);
          tableDetails.push({
            tableName,
            exists: false,
            error: tableError.message
          });
        }
      }
      
      // 2. 테스트 데이터 삽입 시도
      const testTableName = 'monthly_comments';
      const testData = {
        year_month: '2024-03',
        content: '직접 Supabase 연결 테스트',
        comment_date: new Date().toISOString()
      };
      
      let insertResult;
      try {
        const { data: insertData, error: insertError } = await supabase
          .from(testTableName)
          .upsert(testData)
          .select();
          
        insertResult = {
          success: !insertError,
          data: insertData,
          error: insertError ? insertError.message : null
        };
      } catch (insertErr: any) {
        insertResult = {
          success: false,
          error: insertErr.message
        };
      }
      
      setDirectTestResult({
        tableDetails,
        testInsert: insertResult
      });
      
    } catch (error: any) {
      setError(`직접 테스트 오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Supabase 연결 테스트</h1>
      
      {error && (
        <div className="p-4 mb-6 bg-red-900 text-red-100 rounded-md border border-red-700">
          {error}
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">API 테스트 결과</h2>
        {loading ? (
          <p>로딩 중...</p>
        ) : (
          <pre className="bg-black text-green-400 p-4 rounded-md overflow-auto max-h-96 border border-gray-700">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">직접 테스트</h2>
        <button
          onClick={runDirectTest}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4"
        >
          직접 테스트 실행
        </button>
        
        {directTestResult && (
          <pre className="bg-black text-green-400 p-4 rounded-md overflow-auto max-h-96 border border-gray-700">
            {JSON.stringify(directTestResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
} 