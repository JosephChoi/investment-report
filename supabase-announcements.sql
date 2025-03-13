-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  importance_level SMALLINT NOT NULL CHECK (importance_level BETWEEN 1 AND 3), -- 1: 매우 중요, 2: 중요, 3: 보통
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'portfolio')),
  target_portfolios UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- 첨부 파일 테이블 생성
CREATE TABLE IF NOT EXISTS announcement_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 공지사항 테이블에 인덱스 추가
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS announcements_importance_level_idx ON announcements(importance_level);
CREATE INDEX IF NOT EXISTS announcements_target_type_idx ON announcements(target_type);

-- 첨부 파일 테이블에 인덱스 추가
CREATE INDEX IF NOT EXISTS announcement_attachments_announcement_id_idx ON announcement_attachments(announcement_id);

-- RLS(Row Level Security) 설정
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_attachments ENABLE ROW LEVEL SECURITY;

-- 관리자 정책: 모든 공지사항에 대한 CRUD 권한
CREATE POLICY admin_announcements_policy ON announcements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- 고객 정책: 본인에게 해당하는 공지사항에 대한 읽기 권한
CREATE POLICY user_announcements_read_policy ON announcements
  FOR SELECT
  TO authenticated
  USING (
    (target_type = 'all') OR
    (target_type = 'portfolio' AND
     EXISTS (
       SELECT 1 FROM portfolios
       WHERE portfolios.user_id = auth.uid()
       AND portfolios.id = ANY(announcements.target_portfolios)
     ))
  );

-- 관리자 정책: 모든 첨부 파일에 대한 CRUD 권한
CREATE POLICY admin_attachments_policy ON announcement_attachments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- 고객 정책: 본인에게 해당하는 공지사항의 첨부 파일에 대한 읽기 권한
CREATE POLICY user_attachments_read_policy ON announcement_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM announcements
      WHERE announcements.id = announcement_attachments.announcement_id
      AND (
        (announcements.target_type = 'all') OR
        (announcements.target_type = 'portfolio' AND
         EXISTS (
           SELECT 1 FROM portfolios
           WHERE portfolios.user_id = auth.uid()
           AND portfolios.id = ANY(announcements.target_portfolios)
         ))
      )
    )
  );

-- 스토리지 버킷 생성 (Supabase 콘솔에서 수동으로 생성해야 함)
-- 버킷 이름: announcements
-- 공개 접근: false
-- 파일 업로드 크기 제한: 10MB 