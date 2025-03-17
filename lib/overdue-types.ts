// 데이터베이스 테이블 타입
export interface OverduePayment {
  id: string;
  account_name: string;
  contract_date: string | null;
  mp_name: string | null;
  account_number: string;
  withdrawal_account: string | null;
  previous_day_balance: number | null;
  advisory_fee_total: number | null;
  paid_amount: number | null;
  unpaid_amount: number | null;
  manager: string | null;
  contact_number: string | null;
  overdue_status: string | null;
  updated_at: string;
  batch_id: string;
}

export type OverduePaymentInsert = Omit<OverduePayment, 'id' | 'updated_at'>;
export type OverduePaymentUpdate = Partial<OverduePaymentInsert>;

export interface OverduePaymentNotice {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export type OverduePaymentNoticeInsert = Omit<OverduePaymentNotice, 'id' | 'created_at' | 'updated_at'>;
export type OverduePaymentNoticeUpdate = Partial<OverduePaymentNoticeInsert>;

export interface OverduePaymentUpload {
  id: string;
  file_name: string;
  record_count: number;
  uploaded_at: string;
  uploaded_by: string;
}

export type OverduePaymentUploadInsert = Omit<OverduePaymentUpload, 'id' | 'uploaded_at'>;
export type OverduePaymentUploadUpdate = Partial<OverduePaymentUploadInsert>;

// 엑셀 데이터 타입
export interface ExcelOverdueData {
  계좌명: string;
  계약일: string;
  대표MP명: string;
  계좌번호: string;
  수수료출금계좌: string;
  전일잔고: number;
  자문수수료계: number;
  납입액: number;
  미납금액: number;
  유치자: string;
  연락처: string;
  연체: string;
}

// API 응답 타입
export interface OverduePaymentResponse {
  data: OverduePayment[] | null;
  error: string | null;
}

export interface OverduePaymentNoticeResponse {
  data: OverduePaymentNotice | null;
  error: string | null;
}

export interface OverduePaymentUploadResponse {
  data: {
    batchId: string;
    recordCount: number;
    fileName: string;
  } | null;
  error: string | null;
}

// 고객용 연체정보 표시 타입
export interface CustomerOverdueInfo {
  hasOverdue: boolean;
  overduePayments: OverduePayment[];
  notice: OverduePaymentNotice | null;
}