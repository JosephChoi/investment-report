-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계좌 테이블
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_number TEXT UNIQUE NOT NULL,
  portfolio_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 잔고 기록 테이블
CREATE TABLE IF NOT EXISTS balance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,
  balance DECIMAL NOT NULL,
  record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, year_month)
);

-- 월간 코멘트 테이블
CREATE TABLE IF NOT EXISTS monthly_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_month TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  comment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포트폴리오 리포트 테이블
CREATE TABLE IF NOT EXISTS portfolio_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_month TEXT NOT NULL,
  portfolio_type TEXT NOT NULL,
  report_url TEXT NOT NULL,
  report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 월간 리포트 테이블
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_month TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 테이블 컬럼 정보를 가져오는 함수
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    columns.column_name::TEXT,
    columns.data_type::TEXT
  FROM 
    information_schema.columns
  WHERE 
    columns.table_schema = 'public'
    AND columns.table_name = table_name;
END;
$$ LANGUAGE plpgsql; 