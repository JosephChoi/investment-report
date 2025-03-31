import { useState, useEffect } from 'react';
import { RebalancingHistory, RebalancingHistoryFormData, Portfolio } from '@/lib/types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface RebalancingHistoryFormProps {
  rebalancingHistory?: RebalancingHistory;
  onSubmit: (formData: RebalancingHistoryFormData) => Promise<void>;
  onCancel: () => void;
}

export default function RebalancingHistoryForm({
  rebalancingHistory,
  onSubmit,
  onCancel
}: RebalancingHistoryFormProps) {
  const [portfolioTypeId, setPortfolioTypeId] = useState(rebalancingHistory?.portfolio_type_id || '');
  const [rebalancingDate, setRebalancingDate] = useState<Date | null>(
    rebalancingHistory?.rebalancing_date ? new Date(rebalancingHistory.rebalancing_date) : new Date()
  );
  const [comment, setComment] = useState(rebalancingHistory?.comment || '');
  const [referenceUrl, setReferenceUrl] = useState(rebalancingHistory?.reference_url || '');
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 포트폴리오 목록 조회
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        console.log('포트폴리오 목록 조회 시작...');
        const response = await fetch('/api/portfolios');
        
        if (!response.ok) {
          console.error(`포트폴리오 API 응답 오류: ${response.status} ${response.statusText}`);
          const errorData = await response.json();
          throw new Error(`포트폴리오 목록을 불러오는데 실패했습니다. (${errorData.error || response.statusText})`);
        }
        
        const result = await response.json();
        console.log('API 응답 데이터:', result);
        
        const { data } = result;
        if (!data || data.length === 0) {
          console.log('포트폴리오 데이터가 없습니다.');
          throw new Error('포트폴리오 데이터가 없습니다. 관리자에게 문의하세요.');
        } else {
          console.log(`${data.length}개의 포트폴리오를 불러왔습니다.`);
          setPortfolios(data);
          setError(null);
        }
      } catch (err) {
        console.error('포트폴리오 목록 조회 중 오류 발생:', err);
        setError('포트폴리오 목록을 불러오는데 실패했습니다: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
        // 오류 발생 시 빈 배열 설정
        setPortfolios([]);
      }
    };

    fetchPortfolios();
  }, []);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 필수 필드 검증
      if (!portfolioTypeId) {
        throw new Error('포트폴리오를 선택해주세요.');
      }
      
      if (!rebalancingDate) {
        throw new Error('리밸런싱 일자를 선택해주세요.');
      }
      
      if (!comment.trim()) {
        throw new Error('코멘트를 입력해주세요.');
      }
      
      // URL 형식 검증 (선택적)
      if (referenceUrl && !isValidUrl(referenceUrl)) {
        throw new Error('유효한 URL 형식이 아닙니다.');
      }
      
      // 폼 데이터 생성
      const formData: RebalancingHistoryFormData = {
        portfolio_type_id: portfolioTypeId,
        rebalancing_date: rebalancingDate.toISOString().split('T')[0], // YYYY-MM-DD 형식
        comment: comment.trim(),
        reference_url: referenceUrl.trim()
      };
      
      console.log('리밸런싱 내역 폼 제출:', formData);
      
      // 폼 제출
      await onSubmit(formData);
      
      // 폼 초기화 (새로 생성하는 경우)
      if (!rebalancingHistory) {
        setPortfolioTypeId('');
        setRebalancingDate(new Date());
        setComment('');
        setReferenceUrl('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // URL 유효성 검사 함수
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="portfolio" className="block text-sm font-medium text-black mb-1">
          포트폴리오 <span className="text-red-500">*</span>
        </label>
        <select
          id="portfolio"
          value={portfolioTypeId}
          onChange={(e) => setPortfolioTypeId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
          required
        >
          <option value="">포트폴리오 선택</option>
          {portfolios.map((portfolio) => (
            <option key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="rebalancingDate" className="block text-sm font-medium text-black mb-1">
          리밸런싱 일자 <span className="text-red-500">*</span>
        </label>
        <DatePicker
          id="rebalancingDate"
          selected={rebalancingDate}
          onChange={(date: Date | null) => setRebalancingDate(date)}
          dateFormat="yyyy-MM-dd"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
          required
        />
      </div>
      
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-black mb-1">
          코멘트 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
          placeholder="리밸런싱에 대한 코멘트를 입력하세요"
          required
        />
      </div>
      
      <div>
        <label htmlFor="referenceUrl" className="block text-sm font-medium text-black mb-1">
          참조 URL
        </label>
        <input
          type="url"
          id="referenceUrl"
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
          placeholder="http://example.com"
        />
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '처리 중...' : rebalancingHistory ? '수정' : '생성'}
        </button>
      </div>
    </form>
  );
} 