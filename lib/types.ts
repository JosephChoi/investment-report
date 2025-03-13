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
}

export interface Portfolio {
  id: string;
  name: string;
  user_id: string;
  // 기타 포트폴리오 관련 필드
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  // 기타 사용자 관련 필드
} 