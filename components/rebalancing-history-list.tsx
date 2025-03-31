import { FC } from 'react';
import { RebalancingHistory, Portfolio } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { 
  PencilIcon, 
  TrashIcon, 
  ExternalLinkIcon, 
  EyeIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RebalancingHistoryListProps {
  rebalancingHistories: RebalancingHistory[];
  portfolios: Portfolio[];
  onViewDetail: (rebalancingHistory: RebalancingHistory) => void;
  onEdit?: (rebalancingHistory: RebalancingHistory) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const RebalancingHistoryList: FC<RebalancingHistoryListProps> = ({
  rebalancingHistories,
  portfolios,
  onViewDetail,
  onEdit,
  onDelete,
  isAdmin = false
}) => {
  // 날짜 포맷팅
  const formatRebalancingDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 포트폴리오 이름 가져오기
  const getPortfolioName = (portfolioTypeId: string | null) => {
    if (!portfolioTypeId) return '알 수 없는 포트폴리오';
    const portfolio = portfolios.find(p => p.id === portfolioTypeId);
    return portfolio ? portfolio.name : '알 수 없는 포트폴리오';
  };

  // 코멘트 처리
  const getFormattedComment = (comment: string | null) => {
    if (!comment) return '코멘트 없음';
    
    // HTML 태그가 포함된 경우 미리보기에서는 태그 제거
    return comment.replace(/<[^>]*>/g, '').substring(0, 50) + 
           (comment.length > 50 ? '...' : '');
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-4 text-left text-base font-semibold text-black">
              포트폴리오
            </th>
            <th className="px-6 py-4 text-left text-base font-semibold text-black">
              리밸런싱 날짜
            </th>
            <th className="px-6 py-4 text-left text-base font-semibold text-black">
              내용
            </th>
            <th className="px-6 py-4 text-right text-base font-semibold text-black">
              {isAdmin ? "작업" : "보기"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rebalancingHistories.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center border-b border-gray-200">
                <p className="text-base text-black">리밸런싱 내역이 없습니다.</p>
              </td>
            </tr>
          ) : (
            rebalancingHistories.map((history) => (
              <tr
                key={history.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-base text-black">
                    {getPortfolioName(history.portfolio_type_id)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-base text-black">
                    {formatRebalancingDate(history.rebalancing_date)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-base text-black line-clamp-2">
                    {getFormattedComment(history.comment)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(history)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      상세 보기
                    </Button>
                    {isAdmin && onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(history)}
                        className="text-amber-600 hover:text-amber-700"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        수정
                      </Button>
                    )}
                    {isAdmin && onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('이 리밸런싱 내역을 삭제하시겠습니까?')) {
                            onDelete(history.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        삭제
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RebalancingHistoryList; 