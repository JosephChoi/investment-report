-- 관리자 역할 추가 (실제 사용 시 관리자 사용자 ID로 변경 필요)
-- 아래 주석 처리된 부분은 실제 사용 시 주석 해제하고 사용자 ID를 입력해야 함
/*
INSERT INTO user_roles (user_id, role)
VALUES ('여기에_관리자_사용자_ID_입력', 'admin');
*/

-- 관리자 역할 추가 함수 생성 (SQL 콘솔에서 실행할 수 있는 함수)
CREATE OR REPLACE FUNCTION add_admin_role(admin_email TEXT)
RETURNS TEXT AS $$
DECLARE
  admin_id UUID;
  result TEXT;
BEGIN
  -- 이메일로 사용자 ID 찾기
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
  
  IF admin_id IS NULL THEN
    RETURN '해당 이메일의 사용자를 찾을 수 없습니다: ' || admin_email;
  END IF;
  
  -- 이미 관리자 역할이 있는지 확인
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = admin_id AND role = 'admin') THEN
    RETURN '이미 관리자 역할이 부여된 사용자입니다: ' || admin_email;
  END IF;
  
  -- 관리자 역할 추가
  INSERT INTO user_roles (user_id, role)
  VALUES (admin_id, 'admin');
  
  RETURN '관리자 역할이 성공적으로 추가되었습니다: ' || admin_email;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '오류 발생: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql; 