import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '투자 관리 대시보드',
  description: '고객의 투자 현황을 한눈에 확인할 수 있는 대시보드입니다.',
};

export default function DashboardLayout({
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