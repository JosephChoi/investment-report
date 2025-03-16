# 공지사항 기능명세서

## 1. 개요
- **기능명:** 공지사항 관리 시스템
- **목적:** 관리자가 고객에게 중요 정보를 전달하고, 고객별 계좌 유형에 따라 맞춤형 공지사항을 제공하는 기능
- **대상 사용자:** 관리자(공지사항 작성 및 관리), 고객(공지사항 조회)
- **기술 스택:** Next.js, Tailwind CSS, Supabase(데이터베이스 및 스토리지)
- **관련 페이지:** 
  - 고객용: `/dashboard` (대시보드 내 공지사항 섹션)
  - 관리자용: `/admin/announcements`

## 2. 기능 요구사항

### 2.1 고객용 공지사항 조회 기능
- **파일 위치:** `app/dashboard/page.tsx` (대시보드 내 공지사항 섹션)
- **기능:**
  - 본인에게 해당하는 공지사항 목록 조회 (전체 공지 + 본인 계좌 관련 공지)
  - 공지사항 중요도에 따른 시각적 구분 (매우 중요: 붉은색, 중요: 푸른색, 보통: 기본색)
  - 공지사항 상세 내용 확인
  - 첨부 파일 다운로드
- **UI 구성요소:**
  - 공지사항 목록 (날짜, 제목, 중요도 표시)
  - 중요도별 색상 구분
  - 상세 내용 모달
  - 첨부 파일 다운로드 버튼

### 2.2 관리자용 공지사항 관리 페이지
- **파일 위치:** `app/admin/announcements/page.tsx`
- **기능:**
  - 모든 공지사항 조회 및 필터링
  - 새로운 공지사항 작성
  - 기존 공지사항 수정 및 삭제
  - 공지 대상 설정 (전체 또는 특정 계좌 소유 고객)
  - 중요도 설정 (매우 중요, 중요, 보통)
  - 첨부 파일 업로드 및 관리
- **UI 구성요소:**
  - 공지사항 목록 테이블 (날짜, 제목, 중요도, 대상 표시)
  - 검색 및 필터링 기능 (중요도, 대상, 날짜 범위)
  - 공지사항 작성/수정 폼
  - 대상 선택 드롭다운 (전체, 특정 계좌 - 다중 선택 가능)
  - 중요도 선택 라디오 버튼
  - Quill 에디터
  - 파일 업로드 영역

## 3. 데이터 모델

### 3.1 공지사항 데이터
- **테이블명:** `announcements`
- **주요 필드:**
  - `id`: 공지사항 고유 ID (UUID)
  - `title`: 공지사항 제목
  - `content`: 공지사항 내용 (Quill 에디터 HTML 형식)
  - `importance_level`: 중요도 (1: 매우 중요, 2: 중요, 3: 보통)
  - `target_type`: 대상 유형 ('all' 또는 'account')
  - `target_accounts`: 대상 계좌 ID 배열 (target_type이 'account'인 경우)
  - `created_at`: 생성 일시
  - `updated_at`: 수정 일시
  - `created_by`: 작성자 ID (관리자)
- **API 엔드포인트:** `/api/announcements`

### 3.2 첨부 파일 데이터
- **테이블명:** `announcement_attachments`
- **주요 필드:**
  - `id`: 첨부 파일 고유 ID (UUID)
  - `announcement_id`: 공지사항 ID (외래 키)
  - `file_name`: 파일 원본 이름
  - `file_size`: 파일 크기
  - `file_type`: 파일 MIME 타입
  - `file_url`: Supabase Storage 파일 경로
  - `uploaded_at`: 업로드 일시
- **API 엔드포인트:** `/api/announcement-attachments`
- **스토리지 경로:** `announcements/{announcement_id}/{file_id}`

## 4. 컴포넌트 구조

### 4.1 공통 컴포넌트
- **Quill 에디터 컴포넌트**
  - **파일 위치:** `components/quill-editor.tsx`
  - **기능:**
    - 텍스트 서식 지정 (굵게, 기울임, 목록 등)
    - 하이퍼링크 삽입 및 편집
    - 이미지 업로드 및 삽입
  - **사용 라이브러리:** React Quill

- **파일 업로드 컴포넌트**
  - **파일 위치:** `components/file-uploader.tsx`
  - **기능:**
    - 드래그 앤 드롭 파일 업로드
    - 다중 파일 업로드 지원
    - 파일 크기 및 타입 검증
  - **사용 라이브러리:** react-dropzone

### 4.2 페이지별 컴포넌트
- **공지사항 목록 컴포넌트**
  - **파일 위치:** `components/announcement-list.tsx`
  - **기능:**
    - 공지사항 목록 표시
    - 중요도별 색상 구분
    - 정렬 및 필터링
    - 페이지네이션

- **공지사항 폼 컴포넌트**
  - **파일 위치:** `components/announcement-form.tsx`
  - **기능:**
    - 공지사항 작성 및 수정 폼
    - 대상 선택 드롭다운 (전체, 특정 계좌 - 다중 선택)
    - 중요도 선택 라디오 버튼
    - Quill 에디터 통합
    - 파일 업로드 컴포넌트 통합

- **공지사항 상세 컴포넌트**
  - **파일 위치:** `components/announcement-detail.tsx`
  - **기능:**
    - 공지사항 상세 정보 표시
    - 첨부 파일 목록 및 다운로드
    - HTML 콘텐츠 렌더링

- **대시보드 공지사항 섹션 컴포넌트**
  - **파일 위치:** `components/dashboard-announcements.tsx`
  - **기능:**
    - 대시보드에 표시될 공지사항 목록
    - 중요도별 색상 구분
    - 간략한 내용 표시 및 상세 보기 기능

## 5. API 엔드포인트

### 5.1 공지사항 API
- **GET `/api/announcements`**
  - 모든 공지사항 조회 (관리자용)
  - 쿼리 파라미터: `importance_level`, `target_type`, `start_date`, `end_date`, `page`, `limit`

- **GET `/api/announcements/user`**
  - 현재 로그인한 사용자에게 해당하는 공지사항 조회 (고객용)
  - 사용자의 계좌 정보를 기반으로 필터링

- **GET `/api/announcements/{id}`**
  - 특정 공지사항 상세 조회

- **POST `/api/announcements`**
  - 새로운 공지사항 생성
  - 요청 본문: `title`, `content`, `importance_level`, `target_type`, `target_accounts`

- **PUT `/api/announcements/{id}`**
  - 기존 공지사항 수정
  - 요청 본문: `title`, `content`, `importance_level`, `target_type`, `target_accounts`

- **DELETE `/api/announcements/{id}`**
  - 공지사항 삭제

### 5.2 첨부 파일 API
- **GET `/api/announcement-attachments/{announcement_id}`**
  - 특정 공지사항의 첨부 파일 목록 조회

- **POST `/api/announcement-attachments`**
  - 첨부 파일 업로드
  - 요청 본문: `announcement_id`, `file` (multipart/form-data)

- **DELETE `/api/announcement-attachments/{id}`**
  - 첨부 파일 삭제

## 6. Supabase 연동

### 6.1 데이터베이스 연동
- **테이블 생성:**
  - `announcements` 테이블 생성
  - `announcement_attachments` 테이블 생성
  - 외래 키 제약 조건 설정

- **RLS(Row Level Security) 설정:**
  - 관리자: 모든 공지사항에 대한 CRUD 권한
  - 고객: 본인에게 해당하는 공지사항에 대한 읽기 권한만 부여

### 6.2 스토리지 연동
- **버킷 생성:**
  - `announcements` 버킷 생성

- **스토리지 규칙 설정:**
  - 관리자: 모든 파일에 대한 읽기/쓰기 권한
  - 고객: 본인에게 해당하는 공지사항 관련 파일에 대한 읽기 권한만 부여

## 7. 사용자 인터페이스 (UI/UX)

### 7.1 고객용 공지사항 섹션 (대시보드)
- **디자인 가이드라인:**
  - 중요도에 따른 색상 구분 (매우 중요: 붉은색, 중요: 푸른색, 보통: 기본색)
  - 최신 공지사항을 상단에 표시
  - 간결하고 직관적인 UI
  - 모바일 반응형 디자인

- **사용자 경험 고려사항:**
  - 중요 공지사항은 시각적으로 강조
  - 공지사항 상세 내용은 모달로 표시
  - 첨부 파일 다운로드 시 진행 상태 표시

### 7.2 관리자용 공지사항 관리 페이지
- **디자인 가이드라인:**
  - 효율적인 관리를 위한 데이터 테이블 형태
  - 중요도별 색상 구분
  - 필터링 및 검색 기능 강조
  - 작성/수정 폼은 모달로 구현

- **사용자 경험 고려사항:**
  - 계좌 다중 선택 UI (멀티 셀렉트)
  - 중요도 선택 UI (라디오 버튼)
  - Quill 에디터의 직관적인 UI
  - 드래그 앤 드롭 파일 업로드 지원

## 8. 구현 현황

### 8.1 구현 완료 기능
- 공지사항 CRUD 기능
- Quill 에디터 통합
- 첨부 파일 업로드 및 다운로드
- 중요도별 표시 기능
- 대상 필터링 기능 (전체 vs 특정 계좌)
- 모바일 반응형 UI

### 8.2 개선 필요 사항
- 공지사항 검색 기능 최적화
- 첨부 파일 다운로드 속도 개선
- 대용량 첨부 파일 처리 방식 개선

## 9. 향후 개선 계획

### 9.1 단기 개선 계획 (1-2개월)
- 공지사항 검색 기능 고도화
- 첨부 파일 미리보기 기능 추가
- UI/UX 개선

### 9.2 장기 개선 계획 (3-6개월)
- 공지사항 예약 발행 기능
- 읽음 확인 기능
- 공지사항 알림 시스템 (이메일, 푸시 알림)
- 공지사항 템플릿 기능
- 통계 및 리포트 기능 (공지사항 열람률 등)

---

이 문서는 투자 관리 대시보드의 공지사항 기능에 대한 명세서입니다. 마지막 업데이트: 2023.03.04 