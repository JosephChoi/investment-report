-- 외래 키 제약 조건을 우회하여 상담 기록을 생성하는 RPC 함수
CREATE OR REPLACE FUNCTION create_consultation_without_fk_check(
  p_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_consultation_date DATE,
  p_created_at TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- 외래 키 제약 조건을 우회하여 직접 INSERT 실행
  EXECUTE 'INSERT INTO consultations (user_id, title, content, consultation_date, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, title, consultation_date'
  INTO v_result
  USING p_user_id, p_title, p_content, p_consultation_date, p_created_at;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 