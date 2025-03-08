-- 이메일로 고객 정보 찾기 함수
CREATE OR REPLACE FUNCTION find_customer_by_email(customer_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- 사용자 테이블에서 이메일로 검색
  SELECT 
    jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'name', u.name,
      'phone', u.phone,
      'source', 'users'
    ) INTO result
  FROM users u
  WHERE u.email = customer_email
  LIMIT 1;
  
  -- 사용자 테이블에서 찾지 못한 경우 계좌 테이블 연결된 사용자 검색
  IF result IS NULL THEN
    SELECT 
      jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'name', u.name,
        'phone', u.phone,
        'account_number', a.account_number,
        'portfolio_type', a.portfolio_type,
        'source', 'accounts'
      ) INTO result
    FROM accounts a
    JOIN users u ON a.user_id = u.id
    WHERE u.email = customer_email
    LIMIT 1;
  END IF;
  
  -- 잔고 기록에서 이메일 검색 (이 부분은 데이터 구조에 따라 수정 필요)
  IF result IS NULL THEN
    SELECT 
      jsonb_build_object(
        'email', customer_email,
        'source', 'balance_records'
      ) INTO result
    FROM balance_records br
    JOIN accounts a ON br.account_id = a.id
    JOIN users u ON a.user_id = u.id
    WHERE u.email = customer_email
    LIMIT 1;
  END IF;
  
  RETURN result;
END;
$$;

-- 이메일이 고객 데이터에 존재하는지 확인하는 함수
CREATE OR REPLACE FUNCTION check_customer_email(customer_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_exists BOOLEAN;
BEGIN
  -- 사용자 테이블에서 이메일 확인
  SELECT EXISTS(
    SELECT 1 FROM users WHERE email = customer_email
  ) INTO customer_exists;
  
  -- 사용자 테이블에 없으면 계좌 테이블 연결된 사용자 확인
  IF NOT customer_exists THEN
    SELECT EXISTS(
      SELECT 1 
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE u.email = customer_email
    ) INTO customer_exists;
  END IF;
  
  -- 잔고 기록에서 이메일 확인 (이 부분은 데이터 구조에 따라 수정 필요)
  IF NOT customer_exists THEN
    SELECT EXISTS(
      SELECT 1 
      FROM balance_records br
      JOIN accounts a ON br.account_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE u.email = customer_email
    ) INTO customer_exists;
  END IF;
  
  RETURN customer_exists;
END;
$$; 