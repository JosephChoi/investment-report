다음은 **투자 관리 대시보드**의 데이터베이스 설계입니다.  
**Supabase (PostgreSQL)**를 기반으로, **엑셀 데이터(고객 정보, 잔고 정보)**를 활용할 수 있도록 구성했습니다.  

---

# **투자 관리 대시보드 데이터베이스 설계**  

## **1. 개요**  
- **DBMS**: Supabase (PostgreSQL 기반)  
- **데이터 저장 방식**: 고객 데이터는 매월 엑셀/CSV로 업로드되며, 기존 데이터와 누적 저장됨  
- **파일 저장 방식**: Supabase Storage를 활용하여 단일 경로 구조(`year/month/filename`)로 저장
- **주요 테이블**:  
  - `users`: 사용자 정보 저장 (고객 및 관리자 구분)  
  - `accounts`: 고객 계좌 정보 저장  
  - `balance_records`: 고객 잔고 변화 데이터 저장  
  - `monthly_comments`: 월간 코멘트 저장  
  - `portfolio_reports`: 포트폴리오 리포트 파일 정보 저장  
  - `monthly_reports`: 월간 리포트 정보 저장  

---

## **2. 테이블 스키마**  

### **1) 사용자 테이블 (`users`)**  
고객 및 관리자의 기본 정보를 저장하는 테이블  

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2) 계좌 테이블 (`accounts`)**  
고객 계좌 정보 및 포트폴리오 정보 저장  

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_number TEXT UNIQUE NOT NULL,
    portfolio_type TEXT NOT NULL,
    contract_date TIMESTAMP WITH TIME ZONE,
    contract_type TEXT,
    operation_date TIMESTAMP WITH TIME ZONE,
    serial_number TEXT,
    contract_status TEXT,
    contract_amount NUMERIC,
    payment_period TEXT,
    channel_type TEXT,
    fee_rate NUMERIC,
    manager_id TEXT,
    manager_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3) 잔고 기록 테이블 (`balance_records`)**  
매월 고객의 잔고 변화를 저장하여 그래프 생성 시 활용  

```sql
CREATE TABLE balance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    year_month TEXT NOT NULL, -- 'YYYY-MM' 형식
    balance NUMERIC NOT NULL,
    record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (account_id, year_month)
);
```

### **4) 월간 코멘트 테이블 (`monthly_comments`)**  
관리자가 등록하는 월간 코멘트를 저장  

```sql
CREATE TABLE monthly_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_month TEXT NOT NULL, -- 'YYYY-MM' 형식
    content TEXT NOT NULL,
    comment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **5) 포트폴리오 리포트 테이블 (`portfolio_reports`)**  
포트폴리오 리포트 파일 정보 저장  

```sql
CREATE TABLE portfolio_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_month TEXT NOT NULL, -- 'YYYY-MM' 형식
    portfolio_type TEXT NOT NULL,
    report_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    original_file_name TEXT,
    file_size NUMERIC,
    file_type TEXT,
    report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **6) 월간 리포트 테이블 (`monthly_reports`)**  
월간 리포트 정보 저장  

```sql
CREATE TABLE monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_month TEXT NOT NULL UNIQUE, -- 'YYYY-MM' 형식
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## **3. 관계 정의**  
- **`users (1) - (N) accounts`** → 고객은 여러 개의 계좌를 가질 수 있음  
- **`accounts (1) - (N) balance_records`** → 한 계좌의 잔고 변화 데이터가 누적됨  
- **`year_month`** → 월간 코멘트, 포트폴리오 리포트, 월간 리포트, 잔고 기록을 연결하는 공통 키  

---

## **4. 인덱스 및 최적화**  
- **`accounts(user_id)`** → 사용자별 계좌 조회 최적화  
- **`accounts(account_number)`** → 계좌 번호 검색 최적화  
- **`balance_records(account_id, year_month)`** → 계좌별, 월별 잔고 조회 최적화  
- **`portfolio_reports(year_month, portfolio_type)`** → 월별, 포트폴리오별 리포트 조회 최적화  

---

## **5. 데이터 흐름**  

### **1) 사용자 인증 및 정보 관리**  
- Supabase Auth를 통한 사용자 인증 (이메일/비밀번호)
- 로그인 성공 시 사용자 정보가 없으면 자동으로 `users` 테이블에 생성
- 회원가입 시 이메일 인증 후 `users` 테이블에 정보 저장

### **2) 고객 데이터 업로드 (관리자)**  
- 관리자가 엑셀 파일 업로드
- 파일 파싱 후 고객 정보는 `accounts` 테이블에 저장
- 잔고 정보는 `balance_records` 테이블에 저장
- 기존 데이터가 있는 경우 `upsert` 방식으로 업데이트

### **3) 월간 리포트 관리 (관리자)**  
- 관리자가 월간 코멘트 작성 → `monthly_comments` 테이블에 저장
- 포트폴리오 리포트 파일 업로드 과정:
  1. 파일 유효성 검증 (형식: JPG, PNG, GIF / 크기: 최대 10MB)
  2. 파일명 정규화 및 특수문자 제거
  3. Supabase Storage에 단일 경로 구조(`year/month/filename`)로 저장
  4. 기존 파일 확인 및 덮어쓰기 처리
  5. 업로드 실패 시 자동 재시도 (최대 3회)
  6. 파일 URL 및 메타데이터를 `portfolio_reports` 테이블에 저장
- 월간 리포트 정보 등록 → `monthly_reports` 테이블에 저장

### **4) 대시보드 데이터 조회 (고객)**  
- 로그인한 사용자의 계좌 정보 조회 → `accounts` 테이블에서 `user_id`로 필터링
- 잔고 변화 데이터 조회 → `balance_records` 테이블에서 `account_id`로 필터링
- 월간 리포트 조회 → `monthly_reports`, `monthly_comments`, `portfolio_reports` 테이블에서 `year_month`로 필터링

---

## **6. 보안 및 권한 관리**  

### **1) Row Level Security (RLS)**  
Supabase에서는 RLS를 통해 테이블 수준의 보안을 설정할 수 있습니다.

- **`users` 테이블**: 사용자는 자신의 정보만 조회/수정 가능
- **`accounts` 테이블**: 사용자는 자신의 계좌만 조회 가능
- **`balance_records` 테이블**: 사용자는 자신의 계좌에 연결된 잔고 기록만 조회 가능
- **관리자**: 모든 테이블에 대한 전체 권한 부여

### **2) 서비스 역할 키 (Service Role Key)**  
관리자 기능 및 API에서는 서비스 역할 키를 사용하여 RLS를 우회하고 필요한 데이터에 접근합니다.

```typescript
// 서비스 역할 키를 사용하는 Supabase 클라이언트
export const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    return supabase; // 일반 클라이언트 반환
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};
```

### **3) 파일 업로드 및 접근 보안**
- **파일 형식 검증**: 클라이언트 및 서버 측에서 허용된 파일 형식만 업로드 가능
- **파일 크기 제한**: 최대 10MB로 제한하여 서버 부하 방지
- **파일 접근 제어**: 
  - 공개 URL은 인증된 사용자만 접근 가능
  - 서명된 URL은 제한된 시간 동안만 유효
- **파일명 정규화**: 특수문자 및 공백 제거로 보안 취약점 방지

```typescript
// 파일명 정규화 함수
export const sanitizeFileName = (fileName: string): string => {
  // 확장자 추출
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // 파일명에서 특수문자 및 공백 제거
  let baseName = fileName.split('.').slice(0, -1).join('.');
  baseName = baseName.replace(/[^\w가-힣]/g, '_').replace(/_+/g, '_');
  
  return `${baseName}.${extension}`;
};
```

---

## **7. 데이터 마이그레이션 및 백업**  

### **1) 초기 데이터 설정**  
- 관리자 계정 생성: `kunmin.choi@gmail.com`
- 테스트 고객 데이터 업로드 기능 제공

### **2) 백업 전략**  
- Supabase 자체 백업 기능 활용
- 중요 데이터는 주기적으로 CSV 형태로 내보내기

### **3) 파일 관리 전략**
- 중요 파일은 별도 백업 시스템에 복제
- 파일 업로드 로그 기록 및 모니터링
- 정기적인 스토리지 정리 및 최적화

---

## **8. 스토리지 구조 및 관리**

### **1) 스토리지 버킷 구조**
```
portfolio-reports/
├── 2024/
│   ├── 01/
│   │   ├── global_growth_01.jpg
│   │   ├── pension_savings_01.jpg
│   │   └── ...
│   ├── 02/
│   │   ├── global_growth_02.jpg
│   │   ├── pension_savings_02.jpg
│   │   └── ...
│   └── ...
├── 2025/
│   ├── 01/
│   ├── 02/
│   └── ...
└── ...
```

### **2) 파일 명명 규칙**
- 형식: `{portfolio_type}_{month}.{extension}`
- 예시: `global_growth_03.jpg`, `pension_savings_03.jpg`
- 특수문자 및 공백은 언더스코어(`_`)로 대체

### **3) 파일 업로드 및 관리 프로세스**
1. **파일 검증**:
   - 허용된 형식(JPG, PNG, GIF) 확인
   - 파일 크기 제한(10MB) 확인
2. **파일명 처리**:
   - 원본 파일명 저장
   - 파일명 정규화 및 특수문자 제거
   - 포트폴리오 타입 및 월 정보 추출
3. **중복 파일 처리**:
   - 기존 파일 확인
   - 기존 파일 삭제 후 새 파일 업로드
   - 삭제 후 업로드 사이에 지연 시간 추가(2초)
4. **오류 처리**:
   - 업로드 실패 시 자동 재시도(최대 3회)
   - 각 시도 사이에 지연 시간 증가(2초, 4초, 6초)
   - 상세 오류 로깅 및 사용자 피드백

### **4) 파일 접근 방식**
- **공개 URL**: `https://{supabase-project}.supabase.co/storage/v1/object/public/portfolio-reports/2025/03/global_growth_03.jpg`
- **서명된 URL**: 제한된 시간 동안만 유효한 URL 생성

### **5) API 구조**
```
app/api/
├── admin/
│   ├── portfolio-file/
│   │   └── upload/
│   │       └── route.ts       # 파일 업로드 API 엔드포인트
│   ├── monthly-comment/       # 월간 코멘트 API
│   ├── monthly-report/        # 월간 리포트 API
│   └── ...
└── ...
```

### **6) 파일 업로드 API 구현**
파일 업로드 API는 `app/api/admin/portfolio-file/upload/route.ts`에 구현되어 있으며, 다음과 같은 주요 기능을 제공합니다:

```typescript
// 파일 업로드 API 주요 기능
- 파일 유효성 검증 (MIME 타입, 크기)
- 파일명 정규화 및 영문화
- 중복 파일 확인 및 삭제
- 업로드 재시도 메커니즘
- 상세 오류 처리 및 로깅
- 성공 시 파일 URL 및 메타데이터 반환
```

---

이 설계를 기반으로 개발이 진행되었으며, 필요에 따라 스키마가 확장될 수 있습니다.