-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  importance_level SMALLINT NOT NULL DEFAULT 3,
  target_type TEXT NOT NULL DEFAULT 'all',
  target_portfolios UUID[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 공지사항 첨부파일 테이블 생성
CREATE TABLE IF NOT EXISTS public.announcement_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS announcements_importance_level_idx ON public.announcements(importance_level);
CREATE INDEX IF NOT EXISTS announcements_target_type_idx ON public.announcements(target_type);
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS announcement_attachments_announcement_id_idx ON public.announcement_attachments(announcement_id);

-- RLS(Row Level Security) 정책 설정
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_attachments ENABLE ROW LEVEL SECURITY;

-- 관리자만 공지사항 생성/수정/삭제 가능
CREATE POLICY "관리자만 공지사항 생성 가능" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "관리자만 공지사항 수정 가능" ON public.announcements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "관리자만 공지사항 삭제 가능" ON public.announcements
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 모든 인증된 사용자는 공지사항 조회 가능
CREATE POLICY "인증된 사용자는 공지사항 조회 가능" ON public.announcements
  FOR SELECT TO authenticated
  USING (true);

-- 첨부파일 정책
CREATE POLICY "관리자만 첨부파일 생성 가능" ON public.announcement_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "관리자만 첨부파일 삭제 가능" ON public.announcement_attachments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "인증된 사용자는 첨부파일 조회 가능" ON public.announcement_attachments
  FOR SELECT TO authenticated
  USING (true);

-- 스토리지 버킷 생성 (이 부분은 SQL로 직접 실행할 수 없으므로 별도 명령어로 실행해야 함)
-- 아래는 참고용 주석입니다.
-- 
-- 다음 명령어로 스토리지 버킷 생성:
-- supabase storage create announcements
--
-- 다음 명령어로 스토리지 정책 설정:
-- supabase storage policy create announcements --name "관리자만 파일 업로드 가능" --insert "auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')"
-- supabase storage policy create announcements --name "인증된 사용자는 파일 다운로드 가능" --select "auth.role() = 'authenticated'"
-- supabase storage policy create announcements --name "관리자만 파일 삭제 가능" --delete "auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')" 