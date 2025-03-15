-- users 테이블을 customers로 이름 변경
ALTER TABLE IF EXISTS public.users RENAME TO customers;

-- 외래 키 제약 조건 업데이트 (accounts 테이블의 user_id 참조)
ALTER TABLE IF EXISTS public.accounts 
  DROP CONSTRAINT IF EXISTS accounts_user_id_users_id_fk,
  ADD CONSTRAINT accounts_user_id_customers_id_fk 
  FOREIGN KEY (user_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- 기타 참조 테이블이 있다면 여기에 추가
-- 예: ALTER TABLE IF EXISTS public.other_table DROP CONSTRAINT IF EXISTS other_table_user_id_fkey, ADD CONSTRAINT other_table_user_id_customers_id_fk FOREIGN KEY (user_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- 인덱스 이름 업데이트 (필요한 경우)
ALTER INDEX IF EXISTS users_email_unique RENAME TO customers_email_unique;

-- 시퀀스 이름 업데이트 (필요한 경우)
-- ALTER SEQUENCE IF EXISTS users_id_seq RENAME TO customers_id_seq; 