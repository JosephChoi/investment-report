'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OverduePayment } from '@/lib/overdue-types';
import { formatCurrency } from '@/lib/utils';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

interface OverduePaymentListProps {
  batchId?: string;
  onSelectPayment?: (payment: OverduePayment) => void;
}

export default function OverduePaymentList({ batchId, onSelectPayment }: OverduePaymentListProps) {
  const [payments, setPayments] = useState<OverduePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pageSize = 10;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 검색어 디바운스 처리
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms 디바운스
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // 데이터 가져오기
  const fetchOverduePayments = useCallback(async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (debouncedSearchTerm) {
        queryParams.append('search', debouncedSearchTerm);
      }
      
      if (batchId) {
        queryParams.append('batch_id', batchId);
      }
      
      const response = await fetch(`/api/overdue-payments?${queryParams.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error('연체정보를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPayments(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (err) {
      console.error('연체정보 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [batchId, debouncedSearchTerm, currentPage, pageSize]);

  // 디바운스된 검색어, 페이지, 배치 ID 변경 시 데이터 가져오기
  useEffect(() => {
    fetchOverduePayments();
  }, [fetchOverduePayments, deleteSuccess]);

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // 검색어 변경 시 첫 페이지로 이동
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // 검색 폼 제출 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 이미 디바운스 처리되므로 추가 작업 필요 없음
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayments(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPayments(payments.map(payment => payment.id));
    } else {
      setSelectedPayments([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPayments.length === 0) {
      setDeleteError('삭제할 연체정보를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedPayments.length}개의 연체정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      setDeleteSuccess(null);

      const response = await fetch('/api/overdue-payments/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIds: selectedPayments }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '연체정보 삭제 중 오류가 발생했습니다.');
      }

      setDeleteSuccess(result.message || '선택한 연체정보가 성공적으로 삭제되었습니다.');
      setSelectedPayments([]);

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('연체정보 삭제 오류:', err);
      setDeleteError(err instanceof Error ? err.message : '연체정보 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-64 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>연체정보를 불러오는데 문제가 발생했습니다.</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="고객명, 계좌번호, 연체상태 검색..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            autoCapitalize="off"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            검색
          </button>
        </form>

        <button
          onClick={handleDeleteSelected}
          disabled={selectedPayments.length === 0 || deleteLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            selectedPayments.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          } transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500`}
        >
          <Trash2 className="w-4 h-4" />
          {deleteLoading ? '삭제 중...' : `선택한 항목 삭제 (${selectedPayments.length})`}
        </button>
      </div>

      {deleteSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{deleteSuccess}</p>
        </div>
      )}

      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{deleteError}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedPayments.length > 0 && selectedPayments.length === payments.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                고객명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                계좌번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                대표MP명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                미납금액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                연체상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                연락처
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  연체정보가 없습니다.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr
                  key={payment.id}
                  className={`hover:bg-gray-50 ${selectedPayments.includes(payment.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={() => handleSelectPayment(payment.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => onSelectPayment && onSelectPayment(payment)}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {payment.account_name}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => onSelectPayment && onSelectPayment(payment)}
                  >
                    <div className="text-sm text-gray-900">{payment.account_number}</div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => onSelectPayment && onSelectPayment(payment)}
                  >
                    <div className="text-sm text-gray-900">{payment.mp_name || '-'}</div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => onSelectPayment && onSelectPayment(payment)}
                  >
                    <div className="text-sm font-medium text-red-600">
                      {payment.unpaid_amount ? formatCurrency(payment.unpaid_amount) : '0원'}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => onSelectPayment && onSelectPayment(payment)}
                  >
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.overdue_status?.includes('3달') || payment.overdue_status?.includes('3개월')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {payment.overdue_status || '연체중'}
                    </span>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => onSelectPayment && onSelectPayment(payment)}
                  >
                    <div className="text-sm text-gray-900">{payment.contact_number || '-'}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border border-gray-300 text-sm font-medium ${
                  currentPage === page
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              다음
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}