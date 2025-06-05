import { Button } from "@/components/ui/button";
import { ExternalLink, List, Home, Calendar, Info, Bell } from "lucide-react";
import { RebalancingHistory } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface RebalancingHistoryDetailProps {
  rebalancingHistory: RebalancingHistory;
  onClose: () => void;
}

export default function RebalancingHistoryDetail({
  rebalancingHistory,
  onClose,
}: RebalancingHistoryDetailProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-6">
        {/* 네비게이션 */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={onClose}
            className="group flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:translate-x-1 shadow-lg hover:shadow-xl"
          >
            <List className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-medium">리밸런싱 목록으로</span>
          </button>
          
          <Link 
            href="/dashboard"
            className="group flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:translate-x-1 shadow-lg hover:shadow-xl"
          >
            <span className="font-medium mr-2">대시보드로 이동</span>
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
          </Link>
        </div>

        <div className="space-y-6">
          {/* 포트폴리오 정보 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                <Info className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {rebalancingHistory.portfolio_details?.name} 포트폴리오
              </h2>
            </div>
            <p className="text-gray-800 ml-11">
              {rebalancingHistory.portfolio_details?.description || "설명 없음"}
            </p>
          </div>

          {/* 리밸런싱 날짜 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">리밸런싱 날짜</h2>
            </div>
            <p className="text-gray-800 ml-11 font-medium">
              {formatDate(rebalancingHistory.rebalancing_date)}
            </p>
          </div>

          {/* 리밸런싱 내용 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">리밸런싱 내용</h2>
            </div>
            <div className="ml-11">
              <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {rebalancingHistory.comment}
                </p>
              </div>
            </div>
          </div>

          {/* 참조 링크 */}
          {rebalancingHistory.reference_url && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                  <ExternalLink className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">상세 정보</h2>
              </div>
              <div className="ml-11">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  onClick={() => window.open(rebalancingHistory.reference_url, "_blank")}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  리밸런싱 안내 자세히 보기
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 