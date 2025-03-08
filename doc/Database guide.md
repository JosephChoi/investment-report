다음은 **투자 관리 대시보드**의 데이터베이스 설계입니다.  
**Supabase (PostgreSQL) + DrizzleORM**을 기반으로, **엑셀 데이터(대표MP, 전일잔고)**를 활용할 수 있도록 구성했습니다.  

---

# **투자 관리 대시보드 데이터베이스 설계**  

## **1. 개요**  
- **DBMS**: Supabase (PostgreSQL 기반)  
- **ORM**: DrizzleORM  
- **데이터 저장 방식**: 고객 데이터는 매월 엑셀/CSV로 업로드되며, 기존 데이터와 누적 저장됨  
- **주요 테이블**:  
  - `users`: 사용자 정보 저장 (고객 및 관리자 구분)  
  - `monthly_comments`: 월간 코멘트 저장  
  - `portfolio_reports`: 포트폴리오 리포트 (JPG 파일)  
  - `accounts`: 고객 계좌 정보 저장  
  - `balances`: 고객 잔고 변화 데이터 저장  
  - `uploaded_files`: 업로드된 엑셀/CSV 파일 기록  

---

## **2. 테이블 스키마**  

### **1) 사용자 테이블 (`users`)**  
고객 및 관리자의 기본 정보를 저장하는 테이블  

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Supabase Auth 사용 시 필요 없음
    role TEXT CHECK (role IN ('admin', 'user')) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **2) 월간 코멘트 테이블 (`monthly_comments`)**  
관리자가 등록하는 월간 코멘트를 저장  

```sql
CREATE TABLE monthly_comments (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **3) 포트폴리오 리포트 테이블 (`portfolio_reports`)**  
JPG 리포트 파일 및 포트폴리오 매칭 정보 저장  

```sql
CREATE TABLE portfolio_reports (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    portfolio_name TEXT NOT NULL, -- 대표MP와 매칭
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

### **4) 고객 계좌 테이블 (`accounts`)**  
고객 계좌 정보 및 포트폴리오(대표MP) 정보 저장  

```sql
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_number TEXT UNIQUE NOT NULL,
    portfolio_name TEXT NOT NULL, -- 대표MP와 매칭
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **5) 잔고 변화 테이블 (`balances`)**  
매월 고객의 잔고 변화를 저장하여 그래프 생성 시 활용  

```sql
CREATE TABLE balances (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
    balance NUMERIC NOT NULL,
    recorded_at DATE NOT NULL,
    UNIQUE (account_id, recorded_at) -- 동일 날짜 중복 방지
);
```

---

### **6) 업로드된 파일 테이블 (`uploaded_files`)**  
관리자가 업로드한 엑셀/CSV 파일 기록  

```sql
CREATE TABLE uploaded_files (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

## **3. 관계 정의**  
- **`users (1) - (N) accounts`** → 고객은 여러 개의 계좌를 가질 수 있음  
- **`accounts (1) - (N) balances`** → 한 계좌의 잔고 변화 데이터가 누적됨  
- **`accounts (N) - (1) portfolio_reports`** → 계좌의 포트폴리오 이름과 리포트가 매칭됨  
- **`users (1) - (N) monthly_comments`** → 관리자는 여러 개의 코멘트를 등록할 수 있음  

---

## **4. 인덱스 및 최적화**  
- **`balances(recorded_at)`** → 날짜별 빠른 조회를 위해 인덱스 추가  
- **`accounts(account_number)`** → 계좌 번호 검색 최적화  
- **`portfolio_reports(portfolio_name)`** → 포트폴리오별 리포트 조회 속도 향상  

---

이 설계를 기반으로 개발을 진행할 수 있도록 추가 요청이 있으면 알려주세요! 🚀