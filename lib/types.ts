export interface Announcement {
  id: string;
  title: string;
  content: string;
  importance_level: 1 | 2 | 3; // 1: 매우 중요, 2: 중요, 3: 보통
  target_type: 'all' | 'portfolio';
  target_portfolios: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  portfolio_details?: Portfolio[];
  link_url?: string;
}

export interface AnnouncementAttachment {
  id: string;
  announcement_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_at: string;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  importance_level: 1 | 2 | 3;
  target_type: 'all' | 'portfolio';
  target_portfolios: string[];
  created_at?: string;
  link_url?: string;
  reference_url?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  user_id?: string;
  description?: string;
  type?: string;
  // 기타 포트폴리오 관련 필드
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  // 기타 사용자 관련 필드
}

// 리밸런싱 내역 타입
export interface RebalancingHistory {
  id: string;
  portfolio_type_id: string;
  rebalancing_date: string;
  comment: string;
  reference_url: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  portfolio_details?: Portfolio;
}

// 리밸런싱 내역 폼 데이터 타입
export interface RebalancingHistoryFormData {
  portfolio_type_id: string;
  rebalancing_date: string;
  comment: string;
  reference_url: string;
}

export interface Consultation {
  id: string;
  user_id: string;
  title: string;
  content: string;
  consultation_date: string;
  reference_url?: string;
  created_at: string;
  updated_at: string;
} 