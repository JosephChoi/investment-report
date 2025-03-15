-- 외래 키 제약 조건 제거
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_user_id_fkey;

-- 확인 메시지
SELECT 'Foreign key constraint removed successfully' AS message; 