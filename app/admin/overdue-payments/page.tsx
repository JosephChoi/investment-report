'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Save, AlertTriangle, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import ExcelUploader from '@/components/excel-uploader';
import OverduePaymentList from '@/components/overdue-payment-list';
import OverduePaymentNoticeComponent from '@/components/overdue-payment-notice';
import { OverduePayment, OverduePaymentNotice, OverduePaymentUploadResponse } from '@/lib/overdue-types';

export default function OverduePaymentsPage() {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [notice, setNotice] = useState<OverduePaymentNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 최신 배치 ID 가져오기
        try {
          const batchResponse = await fetch('/api/overdue-payments/batch/latest', {
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (batchResponse.ok) {
            const batchData = await batchResponse.json();
            
            if (batchData.success && batchData.data && batchData.data.batchId) {
              console.log('최신 배치 ID 로드됨:', batchData.data.batchId);
              setSelectedBatchId(batchData.data.batchId);
            } else {
              console.log('최신 배치 ID가 없습니다.');
            }
          } else {
            const errorData = await batchResponse.json();
            console.error('배치 ID 로딩 실패:', errorData);
            throw new Error(errorData.error || '배치 ID를 불러오는데 실패했습니다.');
          }
        } catch (batchErr) {
          console.error('배치 ID 로딩 오류:', batchErr);
          throw batchErr;
        }
        
        // 최신 안내사항 가져오기
        try {
          const noticeResponse = await fetch('/api/overdue-payment-notices/latest', {
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (noticeResponse.ok) {
            const noticeData = await noticeResponse.json();
            
            if (!noticeData.error) {
              setNotice(noticeData.data);
            }
          }
        } catch (noticeErr) {
          console.error('안내사항 로딩 오류:', noticeErr);
          // 안내사항 로딩 실패는 치명적이지 않으므로 전체 오류로 처리하지 않음
        }
      } catch (err) {
        console.error('초기 데이터 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 문제가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleUploadSuccess = async (response: OverduePaymentUploadResponse) => {
    if (response.data) {
      setSelectedBatchId(response.data.batchId);
      setSuccess(`${response.data.recordCount}개의 연체정보가 성공적으로 업로드되었습니다.`);
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };

  const handleSaveNotice = async (content: string) => {
    if (!content.trim()) {
      setError('안내사항 내용을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    
    try {
      const url = notice
        ? `/api/overdue-payment-notices/${notice.id}`
        : '/api/overdue-payment-notices';
      
      const method = notice ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '안내사항 저장 중 오류가 발생했습니다.');
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data && !notice) {
        setNotice(result.data);
      }
      
      setError(null);
      setSuccess('안내사항이 성공적으로 저장되었습니다.');
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('안내사항 저장 오류:', err);
      setError(err instanceof Error ? err.message : '안내사항 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 최신 배치 ID 가져오기
      const batchResponse = await fetch('/api/overdue-payments/batch/latest', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        
        if (batchData.success && batchData.data && batchData.data.batchId) {
          console.log('최신 배치 ID 로드됨:', batchData.data.batchId);
          setSelectedBatchId(batchData.data.batchId);
        } else {
          console.log('최신 배치 ID가 없습니다.');
          setSelectedBatchId(null);
        }
      } else {
        const errorData = await batchResponse.json();
        throw new Error(errorData.error || '배치 ID 로딩 실패');
      }
    } catch (err) {
      console.error('새로고침 오류:', err);
      setError(err instanceof Error ? err.message : '데이터를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white min-h-screen">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/admin" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">연체정보 관리</h1>
        </div>
        <p className="text-gray-600">연체정보를 업로드하고 관리하는 페이지입니다. 엑셀 파일을 업로드하여 연체정보를 갱신하고, 고객에게 표시될 안내사항을 작성할 수 있습니다.</p>
      </div>
      
      {/* 알림 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start animate-fadeIn">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">오류가 발생했습니다</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-start animate-fadeIn">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">성공</p>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* 연체정보 업로드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">연체정보 업로드</h2>
          <p className="text-gray-600 text-sm mb-4">연체가 있는 계좌 정보만 포함된 엑셀 파일을 업로드하세요. 기존 데이터는 모두 삭제되고 새 데이터로 대체됩니다.</p>
          
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-sm">
            <p className="font-medium mb-1">파일 형식 안내</p>
            <p>엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.</p>
            <p>파일에는 계좌명, 계약일, 대표MP명, 계좌번호, 수수료출금계좌, 전일잔고, 자문수수료계, 납입액, 미납금액, 유치자, 연락처, 연체 상태 등의 정보가 포함되어야 합니다.</p>
          </div>
          
          <ExcelUploader onUploadSuccess={handleUploadSuccess} />
        </div>
        
        {/* 연체정보 목록 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">연체정보 목록</h2>
            
            {selectedBatchId && !loading && (
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm transition-colors duration-300"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin-slow" />
                새로고침
              </button>
            )}
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            업로드된 연체정보 목록입니다. 가장 최근에 업로드된 데이터가 표시됩니다.
            <br />
            연체가 해결된 고객의 정보는 체크박스로 선택한 후 삭제할 수 있습니다. 삭제된 정보는 고객 대시보드에 표시되지 않습니다.
          </p>
          
          {loading ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">연체정보를 불러오는 중...</p>
              </div>
            </div>
          ) : selectedBatchId ? (
            <OverduePaymentList batchId={selectedBatchId} />
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">업로드된 연체정보가 없습니다</p>
              <p className="text-sm text-gray-400 mb-4">위의 업로드 섹션에서 엑셀 파일을 업로드하세요.</p>
              
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </button>
            </div>
          )}
        </div>
        
        {/* 연체정보 안내사항 */}
        <div className="mt-6">
          <OverduePaymentNoticeComponent
            initialNotice={notice}
            isEditable={true}
            onSave={handleSaveNotice}
            className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
          />
        </div>
      </div>
    </div>
  );
} 