-- Supabase SQL 에디터에서 실행할 쿼리

-- 0. 포트폴리오 타입 조회 (ID 확인용)
SELECT id, name FROM portfolio_types LIMIT 5;

-- 1. 기존 데이터 백업
CREATE TABLE IF NOT EXISTS announcements_backup AS
SELECT * FROM announcements;

-- 2. target_portfolios 열 재설정
ALTER TABLE announcements 
DROP COLUMN IF EXISTS target_portfolios;

-- 3. 새로운 target_portfolios 열 추가 (UUID 배열 타입)
ALTER TABLE announcements 
ADD COLUMN target_portfolios UUID[] DEFAULT '{}';

-- 4. 기존 공지사항 데이터 확인
SELECT id, title, target_type, target_portfolios FROM announcements;

-- 5. 테스트 데이터 추가 (선택 사항)
-- 전체 공지사항 추가
INSERT INTO announcements (title, content, importance_level, target_type, created_by)
VALUES ('전체 공지사항 테스트', '이 공지사항은 모든 사용자에게 표시됩니다.', 2, 'all', '54cfd40b-b867-47a9-ba08-1312039cabc5')
RETURNING id;

-- 특정 포트폴리오 공지사항 추가 (아래 주석을 해제하고 포트폴리오 ID를 실제 ID로 변경)
-- 위의 포트폴리오 타입 조회 결과에서 ID를 복사하여 아래에 붙여넣기
-- 예시: 'b318f9c0-5048-4edb-9d96-617605019d56' 포트폴리오 ID 사용
INSERT INTO announcements (title, content, importance_level, target_type, target_portfolios, created_by)
VALUES (
  '포트폴리오 공지사항 테스트', 
  '이 공지사항은 특정 포트폴리오 사용자에게만 표시됩니다.', 
  1, 
  'portfolio', 
  ARRAY[('b318f9c0-5048-4edb-9d96-617605019d56')::UUID], 
  '54cfd40b-b867-47a9-ba08-1312039cabc5'
)
RETURNING id;

-- 여러 포트폴리오 대상 공지사항 추가 예시
-- INSERT INTO announcements (title, content, importance_level, target_type, target_portfolios, created_by)
-- VALUES (
--   '여러 포트폴리오 공지사항 테스트', 
--   '이 공지사항은 여러 포트폴리오 사용자에게 표시됩니다.', 
--   1, 
--   'portfolio', 
--   ARRAY[
--     ('b318f9c0-5048-4edb-9d96-617605019d56')::UUID, 
--     ('다른_포트폴리오_ID')::UUID
--   ], 
--   '54cfd40b-b867-47a9-ba08-1312039cabc5'
-- )
-- RETURNING id; 