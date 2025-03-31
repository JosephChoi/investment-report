import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { RebalancingHistory } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface RebalancingHistoryDetailProps {
  rebalancingHistory: RebalancingHistory;
  onClose: () => void;
}

export default function RebalancingHistoryDetail({
  rebalancingHistory,
  onClose,
}: RebalancingHistoryDetailProps) {
  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
          </Button>
          <h2 className="text-xl font-semibold text-black">
            {rebalancingHistory.portfolio_details?.name} 리밸런싱 내역
          </h2>
        </div>
      </div>

      {/* 내용 */}
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-black mb-2">포트폴리오 정보</h3>
          <p className="text-base text-black">
            {rebalancingHistory.portfolio_details?.description || "설명 없음"}
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-black mb-2">리밸런싱 날짜</h3>
          <p className="text-base text-black">
            {formatDate(rebalancingHistory.rebalancing_date)}
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-black mb-2">리밸런싱 내용</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-base text-black whitespace-pre-wrap">
              {rebalancingHistory.comment}
            </p>
          </div>
        </div>

        {/* 참조 링크 (버튼 형태) */}
        {rebalancingHistory.reference_url && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="default"
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.open(rebalancingHistory.reference_url, "_blank")}
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              리밸런싱 안내 자세히 보기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 