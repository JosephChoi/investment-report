'use client';

import { OverduePayment } from '@/lib/overdue-types';
import { formatCurrency } from '@/lib/utils';

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
            <p className="text-gray-500">대표MP명</p>
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
      </div>
    </div>
  );
} 