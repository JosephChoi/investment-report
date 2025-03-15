-- Auth 사용자의 ID를 업데이트하는 함수
CREATE OR REPLACE FUNCTION public.update_auth_user_id(old_id UUID, new_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_rows INT;
BEGIN
  -- auth.users 테이블의 id 업데이트
  UPDATE auth.users
  SET id = new_id
  WHERE id = old_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % rows in auth.users', affected_rows;
  
  -- auth.identities 테이블의 user_id 업데이트
  UPDATE auth.identities
  SET user_id = new_id
  WHERE user_id = old_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % rows in auth.identities', affected_rows;
  
  -- auth.sessions 테이블의 user_id 업데이트
  UPDATE auth.sessions
  SET user_id = new_id
  WHERE user_id = old_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % rows in auth.sessions', affected_rows;
  
  -- auth.refresh_tokens 테이블의 user_id 업데이트
  UPDATE auth.refresh_tokens
  SET user_id = new_id
  WHERE user_id = old_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % rows in auth.refresh_tokens', affected_rows;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Auth 사용자 ID 업데이트 중 오류 발생: %', SQLERRM;
    RETURN FALSE;
END;
$$; 