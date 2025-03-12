-- 스토리지 버킷 생성 (이미 존재하는 경우 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultations', 'consultations', false)
ON CONFLICT (id) DO NOTHING;

-- 스토리지 정책 설정

-- 관리자만 파일 업로드 가능
CREATE POLICY "관리자만 파일 업로드 가능" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'consultations' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자는 모든 파일 조회 가능
CREATE POLICY "관리자는 모든 파일 조회 가능" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'consultations' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 고객은 본인의 상담 내역 관련 파일만 조회 가능
CREATE POLICY "고객은 본인의 상담 내역 관련 파일만 조회 가능" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'consultations' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM consultations
      WHERE user_id = auth.uid()
    )
  );

-- 관리자만 파일 삭제 가능
CREATE POLICY "관리자만 파일 삭제 가능" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'consultations' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자만 파일 업데이트 가능
CREATE POLICY "관리자만 파일 업데이트 가능" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'consultations' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  ); 