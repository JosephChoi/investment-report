-- 사용자 역할 테이블 생성 (관리자 권한 관리용)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 상담 내역 테이블 생성
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  consultation_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT '진행 중',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 첨부 파일 테이블 생성
CREATE TABLE IF NOT EXISTS consultation_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER set_consultations_updated_at
BEFORE UPDATE ON consultations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- RLS(Row Level Security) 설정

-- 상담 내역 테이블 RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 상담 내역에 대한 CRUD 권한
CREATE POLICY "관리자는 모든 상담 내역 관리 가능" ON consultations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 고객은 본인의 상담 내역만 읽기 가능
CREATE POLICY "고객은 본인의 상담 내역만 읽기 가능" ON consultations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 첨부 파일 테이블 RLS
ALTER TABLE consultation_attachments ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 첨부 파일에 대한 CRUD 권한
CREATE POLICY "관리자는 모든 첨부 파일 관리 가능" ON consultation_attachments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 고객은 본인의 상담 내역 관련 첨부 파일만 읽기 가능
CREATE POLICY "고객은 본인의 상담 내역 첨부 파일만 읽기 가능" ON consultation_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = consultation_attachments.consultation_id
      AND consultations.user_id = auth.uid()
    )
  );

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultation_attachments_consultation_id ON consultation_attachments(consultation_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role); 