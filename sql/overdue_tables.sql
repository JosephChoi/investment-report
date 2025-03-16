-- 연체정보 테이블
CREATE TABLE IF NOT EXISTS overdue_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_name TEXT,
  contract_date TIMESTAMP WITH TIME ZONE,
  mp_name TEXT,
  account_number TEXT,
  withdrawal_account TEXT,
  previous_day_balance NUMERIC,
  advisory_fee_total NUMERIC,
  paid_amount NUMERIC,
  unpaid_amount NUMERIC,
  manager TEXT,
  contact_number TEXT,
  overdue_status TEXT,
  batch_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 연체정보 업로드 이력 테이블
CREATE TABLE IF NOT EXISTS overdue_payment_uploads (
  id UUID PRIMARY KEY,
  file_name TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 연체정보 안내사항 테이블
CREATE TABLE IF NOT EXISTS overdue_payment_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS 정책 설정
ALTER TABLE overdue_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE overdue_payment_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE overdue_payment_notices ENABLE ROW LEVEL SECURITY;

-- 관리자만 연체정보 관리 가능
CREATE POLICY "관리자만 연체정보 관리 가능" ON overdue_payments
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 관리자만 연체정보 업로드 이력 관리 가능
CREATE POLICY "관리자만 연체정보 업로드 이력 관리 가능" ON overdue_payment_uploads
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 관리자만 연체정보 안내사항 관리 가능
CREATE POLICY "관리자만 연체정보 안내사항 관리 가능" ON overdue_payment_notices
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 모든 사용자가 연체정보 안내사항 조회 가능
CREATE POLICY "모든 사용자가 연체정보 안내사항 조회 가능" ON overdue_payment_notices
  FOR SELECT
  USING (true);

-- 사용자가 자신의 연체정보만 조회 가능하도록 하는 정책 (나중에 구현) 