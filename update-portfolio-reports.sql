-- portfolio_reports 테이블에 portfolio_type_id 컬럼 추가
ALTER TABLE portfolio_reports ADD COLUMN IF NOT EXISTS portfolio_type_id UUID REFERENCES portfolio_types(id);

-- 기존 portfolio_type 값에 해당하는 portfolio_type_id 설정
UPDATE portfolio_reports pr
SET portfolio_type_id = pt.id
FROM portfolio_types pt
WHERE pr.portfolio_type = pt.name
AND pr.portfolio_type_id IS NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_portfolio_reports_portfolio_type_id ON portfolio_reports(portfolio_type_id);

-- 데이터 확인
SELECT 
    COUNT(*) as total_reports,
    COUNT(portfolio_type_id) as reports_with_portfolio_type_id,
    COUNT(portfolio_type) as reports_with_portfolio_type
FROM portfolio_reports; 