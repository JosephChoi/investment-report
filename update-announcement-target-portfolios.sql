-- 공지사항 테이블의 target_portfolios 데이터 확인
SELECT id, title, target_type, target_portfolios
FROM announcements
WHERE target_type = 'portfolio';

-- 포트폴리오 타입 테이블 확인
SELECT id, name
FROM portfolio_types;

-- 공지사항 테이블의 target_portfolios 데이터를 portfolio_types 테이블의 UUID로 마이그레이션
-- 이 스크립트는 기존 target_portfolios 값이 숫자 ID인 경우에만 작동합니다.
-- 이미 UUID로 저장된 경우에는 변경이 필요 없습니다.

-- 1. 임시 함수 생성: 숫자 ID를 UUID로 변환하는 함수
CREATE OR REPLACE FUNCTION convert_to_uuid(id TEXT)
RETURNS UUID AS $$
DECLARE
  namespace UUID := '1b671a64-40d5-491e-99b0-da01ff1f3341'::UUID;
BEGIN
  RETURN uuid_generate_v5(namespace, 'portfolio-' || id);
END;
$$ LANGUAGE plpgsql;

-- 2. 각 공지사항의 target_portfolios 배열을 순회하여 UUID로 변환
-- 이 부분은 실제 데이터 구조에 따라 수정이 필요할 수 있습니다.
-- 아래는 예시 코드입니다.
DO $$
DECLARE
  announcement_record RECORD;
  old_portfolio_ids TEXT[];
  new_portfolio_ids UUID[];
  portfolio_id TEXT;
BEGIN
  -- UUID 확장 활성화
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  -- 대상 포트폴리오가 있는 공지사항 조회
  FOR announcement_record IN 
    SELECT id, target_portfolios 
    FROM announcements 
    WHERE target_type = 'portfolio' AND array_length(target_portfolios, 1) > 0
  LOOP
    old_portfolio_ids := announcement_record.target_portfolios;
    new_portfolio_ids := ARRAY[]::UUID[];
    
    -- 각 포트폴리오 ID를 UUID로 변환
    FOREACH portfolio_id IN ARRAY old_portfolio_ids
    LOOP
      -- 이미 UUID 형식인지 확인
      BEGIN
        -- UUID로 캐스팅 시도
        IF portfolio_id::UUID IS NOT NULL THEN
          -- 이미 UUID 형식이면 그대로 사용
          new_portfolio_ids := array_append(new_portfolio_ids, portfolio_id::UUID);
        ELSE
          -- 숫자 ID인 경우 변환
          new_portfolio_ids := array_append(new_portfolio_ids, convert_to_uuid(portfolio_id));
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- UUID로 캐스팅 실패 시 변환 함수 사용
        new_portfolio_ids := array_append(new_portfolio_ids, convert_to_uuid(portfolio_id));
      END;
    END LOOP;
    
    -- 변환된 UUID 배열로 업데이트
    UPDATE announcements
    SET target_portfolios = new_portfolio_ids
    WHERE id = announcement_record.id;
    
    RAISE NOTICE 'Updated announcement %: % -> %', 
      announcement_record.id, 
      old_portfolio_ids, 
      new_portfolio_ids;
  END LOOP;
END $$;

-- 3. 임시 함수 삭제
DROP FUNCTION IF EXISTS convert_to_uuid(TEXT);

-- 4. 변경 결과 확인
SELECT id, title, target_type, target_portfolios
FROM announcements
WHERE target_type = 'portfolio'; 