-- accounts 테이블에서 불필요한 null 값 열들과 portfolio_type 열 삭제

-- 먼저 현재 accounts 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'accounts'
ORDER BY ordinal_position;

-- 삭제할 열 목록 확인
-- 1. 대부분 null 값인 열들
-- 2. portfolio_type 열 (portfolio_type_id로 대체됨)

-- 삭제 전 백업 테이블 생성 (안전을 위해)
CREATE TABLE accounts_backup AS SELECT * FROM accounts;

-- 불필요한 열 삭제
ALTER TABLE accounts
DROP COLUMN IF EXISTS contract_type,
DROP COLUMN IF EXISTS operation_date,
DROP COLUMN IF EXISTS serial_number,
DROP COLUMN IF EXISTS contract_status,
DROP COLUMN IF EXISTS contract_amount,
DROP COLUMN IF EXISTS payment_period,
DROP COLUMN IF EXISTS channel_type,
DROP COLUMN IF EXISTS fee_rate,
DROP COLUMN IF EXISTS manager_id,
DROP COLUMN IF EXISTS manager_name;

-- portfolio_type 열 삭제 전 확인
-- 모든 계정에 portfolio_type_id가 설정되어 있는지 확인
SELECT COUNT(*) AS total_accounts,
       COUNT(portfolio_type_id) AS accounts_with_portfolio_type_id
FROM accounts;

-- portfolio_type_id가 없는 계정 확인
SELECT id, account_number, portfolio_type, portfolio_type_id
FROM accounts
WHERE portfolio_type_id IS NULL;

-- portfolio_type_id가 없는 계정에 대해 portfolio_type을 기반으로 portfolio_type_id 설정
DO $$
DECLARE
  account_record RECORD;
  portfolio_type_record RECORD;
BEGIN
  -- portfolio_type_id가 없는 계정 조회
  FOR account_record IN 
    SELECT id, portfolio_type 
    FROM accounts 
    WHERE portfolio_type_id IS NULL AND portfolio_type IS NOT NULL
  LOOP
    -- portfolio_type 이름으로 portfolio_types 테이블에서 ID 조회
    SELECT id INTO portfolio_type_record
    FROM portfolio_types
    WHERE name = account_record.portfolio_type
    LIMIT 1;
    
    -- portfolio_type_id 업데이트
    IF portfolio_type_record.id IS NOT NULL THEN
      UPDATE accounts
      SET portfolio_type_id = portfolio_type_record.id
      WHERE id = account_record.id;
      
      RAISE NOTICE 'Updated account %: portfolio_type_id set to %', 
        account_record.id, 
        portfolio_type_record.id;
    ELSE
      RAISE NOTICE 'Could not find portfolio_type_id for account %: %', 
        account_record.id, 
        account_record.portfolio_type;
    END IF;
  END LOOP;
END $$;

-- 다시 확인: portfolio_type_id가 없는 계정이 있는지 확인
SELECT COUNT(*) AS accounts_without_portfolio_type_id
FROM accounts
WHERE portfolio_type_id IS NULL AND portfolio_type IS NOT NULL;

-- portfolio_type 열 삭제
-- 모든 계정에 portfolio_type_id가 설정되어 있다면 안전하게 삭제 가능
ALTER TABLE accounts
DROP COLUMN IF EXISTS portfolio_type;

-- 변경 후 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'accounts'
ORDER BY ordinal_position; 