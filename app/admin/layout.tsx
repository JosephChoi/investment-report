import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '관리자 페이지 | 투자 관리 대시보드',
  description: '투자 관리 대시보드의 관리자 페이지입니다.',
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
} 