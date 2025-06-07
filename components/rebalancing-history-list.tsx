import { FC } from 'react';
import { RebalancingHistory, Portfolio } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { 
  PencilIcon, 
  TrashIcon, 
  ExternalLinkIcon, 
  EyeIcon,
  Calendar
} from 'lucide-react';


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
    <div className="p-6">
      {rebalancingHistories.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-500" />
          </div>
          <p className="text-lg text-gray-600 font-medium">리밸런싱 내역이 없습니다.</p>
          <p className="text-sm text-gray-500 mt-2">새로운 리밸런싱 정보가 등록되면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rebalancingHistories.map((history, index) => (
            <div
              key={history.id}
              className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 hover:bg-white/70 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* 왼쪽 정보 섹션 */}
                <div className="flex-1 space-y-3">
                  {/* 포트폴리오 이름 */}
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {getPortfolioName(history.portfolio_type_id)}
                    </h3>
                  </div>
                  
                  {/* 날짜 */}
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {formatRebalancingDate(history.rebalancing_date)}
                    </span>
                  </div>
                  
                  {/* 내용 미리보기 */}
                  <div className="bg-gray-50/80 rounded-lg p-3 border border-gray-200/50">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                      {getFormattedComment(history.comment)}
                    </p>
                  </div>
                </div>

                {/* 오른쪽 액션 버튼 섹션 */}
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-auto">
                  <button
                    onClick={() => onViewDetail(history)}
                    className="group flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-medium"
                  >
                    <EyeIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    상세보기
                  </button>
                  
                  {isAdmin && (
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(history)}
                          className="group flex items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-medium"
                        >
                          <PencilIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          수정
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (window.confirm('이 리밸런싱 내역을 삭제하시겠습니까?')) {
                              onDelete(history.id);
                            }
                          }}
                          className="group flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-medium"
                        >
                          <TrashIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          삭제
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RebalancingHistoryList; 