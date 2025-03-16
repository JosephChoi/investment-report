-- 연체정보 테이블 생성
CREATE TABLE IF NOT EXISTS overdue_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_name TEXT NOT NULL,
  contract_date DATE,
  mp_name TEXT,
  account_number TEXT NOT NULL,
  withdrawal_account TEXT,
  previous_day_balance NUMERIC,
  advisory_fee_total NUMERIC,
  paid_amount NUMERIC,
  unpaid_amount NUMERIC,
  manager TEXT,
  contact_number TEXT,
  overdue_status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  batch_id UUID NOT NULL
);

-- 연체정보 안내사항 테이블 생성
CREATE TABLE IF NOT EXISTS overdue_payment_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 업로드 이력 테이블 생성
CREATE TABLE IF NOT EXISTS overdue_payment_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- RLS 정책 설정
ALTER TABLE overdue_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE overdue_payment_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE overdue_payment_uploads ENABLE ROW LEVEL SECURITY;

-- 관리자 정책: 모든 연체정보에 대한 CRUD 권한
CREATE POLICY "관리자는 모든 연체정보를 관리할 수 있음" ON overdue_payments
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- 고객 정책: 본인 계좌의 연체정보만 조회 가능
CREATE POLICY "고객은 본인 계좌의 연체정보만 조회 가능" ON overdue_payments
  FOR SELECT
  TO authenticated
  USING (
    account_number IN (
      SELECT account_number FROM accounts WHERE customer_id = auth.uid()
    )
  );

-- 관리자 정책: 모든 안내사항에 대한 CRUD 권한
CREATE POLICY "관리자는 모든 안내사항을 관리할 수 있음" ON overdue_payment_notices
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- 고객 정책: 안내사항 조회만 가능
CREATE POLICY "고객은 안내사항 조회만 가능" ON overdue_payment_notices
  FOR SELECT
  TO authenticated
  USING (true);

-- 관리자 정책: 모든 업로드 이력에 대한 CRUD 권한
CREATE POLICY "관리자는 모든 업로드 이력을 관리할 수 있음" ON overdue_payment_uploads
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS overdue_payments_account_number_idx ON overdue_payments(account_number);
CREATE INDEX IF NOT EXISTS overdue_payments_batch_id_idx ON overdue_payments(batch_id); 