-- accounts 테이블에 contract_date 컬럼 추가
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS contract_date TIMESTAMP WITH TIME ZONE;

-- 컬럼에 설명 추가
COMMENT ON COLUMN accounts.contract_date IS '최초 계약일';

-- 기존 데이터 확인
SELECT * FROM accounts LIMIT 10; 