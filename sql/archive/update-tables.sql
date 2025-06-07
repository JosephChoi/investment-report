-- balance_records 테이블에 year_month 필드 추가
ALTER TABLE balance_records ADD COLUMN IF NOT EXISTS year_month VARCHAR(7);

-- 기존 데이터에 대해 year_month 값 설정
UPDATE balance_records
SET year_month = TO_CHAR(record_date, 'YYYY-MM')
WHERE year_month IS NULL;

-- year_month와 account_id에 대한 유니크 제약 조건 추가
ALTER TABLE balance_records DROP CONSTRAINT IF EXISTS balance_records_account_id_year_month_key;
ALTER TABLE balance_records ADD CONSTRAINT balance_records_account_id_year_month_key UNIQUE (account_id, year_month);

-- monthly_comments 테이블에 year_month 필드 추가
ALTER TABLE monthly_comments ADD COLUMN IF NOT EXISTS year_month VARCHAR(7);

-- 기존 데이터에 대해 year_month 값 설정
UPDATE monthly_comments
SET year_month = TO_CHAR(comment_date, 'YYYY-MM')
WHERE year_month IS NULL;

-- year_month에 대한 유니크 제약 조건 추가
ALTER TABLE monthly_comments DROP CONSTRAINT IF EXISTS monthly_comments_year_month_key;
ALTER TABLE monthly_comments ADD CONSTRAINT monthly_comments_year_month_key UNIQUE (year_month);

-- portfolio_reports 테이블에 year_month 필드 추가
ALTER TABLE portfolio_reports ADD COLUMN IF NOT EXISTS year_month VARCHAR(7);

-- 기존 데이터에 대해 year_month 값 설정
UPDATE portfolio_reports
SET year_month = TO_CHAR(report_date, 'YYYY-MM')
WHERE year_month IS NULL;

-- 월간 리포트 테이블 생성 (기존에 없는 경우)
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_month VARCHAR(7) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- monthly_reports 테이블에 트리거가 이미 있는지 확인 후 생성
DROP TRIGGER IF EXISTS update_monthly_reports_updated_at ON monthly_reports;
CREATE TRIGGER update_monthly_reports_updated_at
BEFORE UPDATE ON monthly_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성
DROP INDEX IF EXISTS idx_balance_records_year_month;
DROP INDEX IF EXISTS idx_monthly_comments_year_month;
DROP INDEX IF EXISTS idx_portfolio_reports_year_month;
DROP INDEX IF EXISTS idx_monthly_reports_year_month;

CREATE INDEX idx_balance_records_year_month ON balance_records(year_month);
CREATE INDEX idx_monthly_comments_year_month ON monthly_comments(year_month);
CREATE INDEX idx_portfolio_reports_year_month ON portfolio_reports(year_month);
CREATE INDEX idx_monthly_reports_year_month ON monthly_reports(year_month);

-- 테이블 컬럼 정보를 가져오는 함수 (없는 경우 생성)
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