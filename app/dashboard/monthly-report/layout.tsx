import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '월간리포트 | 투자 관리 대시보드',
  description: '월별 투자 현황 및 포트폴리오 리포트를 확인할 수 있습니다.',
};

export default function MonthlyReportLayout({
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