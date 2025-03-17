'use client';

import { OverduePayment } from '@/lib/overdue-types';
import { formatCurrency } from '@/lib/utils';
import { Info } from 'lucide-react';

interface OverduePaymentCardProps {
  overduePayment: OverduePayment;
}

export default function OverduePaymentCard({ overduePayment }: OverduePaymentCardProps) {
  const {
    account_name,
    account_number,
    withdrawal_account,
    mp_name,
    unpaid_amount,
    overdue_status,
  } = overduePayment;

  // 3개월 이상 연체 여부 확인
  const isLongOverdue = overdue_status?.includes('3달') || overdue_status?.includes('3개월');

  // 연체 상태에 따른 색상 설정
  const statusColor = isLongOverdue
    ? 'bg-red-100 text-red-800 border-red-300'
    : 'bg-amber-100 text-amber-800 border-amber-300';
    
  // 계좌번호와 출금계좌가 다른지 확인
  const hasDifferentAccount = withdrawal_account && withdrawal_account !== account_number;

  return (
    <div className="p-4 mb-4 border rounded-lg border-l-4 border-l-red-500">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{account_name}</h3>
          <div className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
            {isLongOverdue ? '3개월 이상 연체중' : '연체중'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">계좌번호</p>
            <p className="font-medium">{account_number}</p>
          </div>
          
          {withdrawal_account && withdrawal_account !== account_number && (
            <div>
              <p className="text-gray-500">출금계좌번호</p>
              <p className="font-medium">{withdrawal_account}</p>
            </div>
          )}
          
          <div>
            <p className="text-gray-500">포트폴리오</p>
            <p className="font-medium">{mp_name || '-'}</p>
          </div>
          
          <div>
            <p className="text-gray-500">미납금액</p>
            <p className="font-bold text-red-600">
              {unpaid_amount ? formatCurrency(unpaid_amount) : '0원'}
            </p>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">연체 상태:</span> {overdue_status || '연체중'}
          </p>
        </div>
        
        {/* 계좌번호와 출금계좌가 다를 경우 비고란 추가 */}
        {hasDifferentAccount && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
            <Info className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 font-medium">
              수수료 출금계좌가 자문계좌와 다릅니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 