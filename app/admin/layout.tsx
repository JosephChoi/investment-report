import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '관리자 페이지 | 투자 관리 대시보드',
  description: '투자 관리 대시보드의 관리자 페이지입니다.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
} 