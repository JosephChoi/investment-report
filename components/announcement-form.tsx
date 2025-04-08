import { useState, useEffect } from 'react';
import { Announcement, AnnouncementFormData, Portfolio } from '@/lib/types';
import QuillEditor from './quill-editor';

interface AnnouncementFormProps {
  announcement?: Announcement;
  onSubmit: (formData: AnnouncementFormData, linkUrl?: string) => Promise<void>;
  onCancel: () => void;
}

export default function AnnouncementForm({
  announcement,
  onSubmit,
  onCancel
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(announcement?.title || '');
  const [content, setContent] = useState(announcement?.content || '');
  const [importanceLevel, setImportanceLevel] = useState<1 | 2 | 3>(announcement?.importance_level || 3);
  const [targetType, setTargetType] = useState<'all' | 'portfolio'>(announcement?.target_type || 'all');
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>(announcement?.target_portfolios || []);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [linkUrl, setLinkUrl] = useState<string>(announcement?.link_url || '');
  const [createDate, setCreateDate] = useState<string>(
    announcement?.created_at 
      ? new Date(announcement.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
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

  // 포트폴리오 선택 핸들러
  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolios((prev) => {
      if (prev.includes(portfolioId)) {
        return prev.filter(id => id !== portfolioId);
      } else {
        return [...prev, portfolioId];
      }
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 필수 필드 검증
      if (!title.trim()) {
        throw new Error('제목을 입력해주세요.');
      }
      
      if (!content.trim()) {
        throw new Error('내용을 입력해주세요.');
      }
      
      if (targetType === 'portfolio' && selectedPortfolios.length === 0) {
        throw new Error('하나 이상의 대상 포트폴리오를 선택해주세요.');
      }
      
      // 폼 데이터 생성
      const formData: AnnouncementFormData = {
        title: title.trim(),
        content,
        importance_level: importanceLevel,
        target_type: targetType,
        target_portfolios: targetType === 'portfolio' ? selectedPortfolios : [],
        created_at: createDate,
        link_url: linkUrl.trim(),
        reference_url: linkUrl.trim()
      };
      
      console.log('공지사항 폼 제출:', formData);
      
      // 폼 제출
      await onSubmit(formData, linkUrl.trim() || undefined);
      
      // 폼 초기화
      if (!announcement) {
        setTitle('');
        setContent('');
        setImportanceLevel(3);
        setTargetType('all');
        setSelectedPortfolios([]);
        setLinkUrl('');
        setCreateDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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
        <label htmlFor="title" className="block text-sm font-medium text-black mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
          placeholder="공지사항 제목을 입력하세요"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="createDate" className="block text-sm font-medium text-black mb-1">
            날짜 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="createDate"
            value={createDate}
            onChange={(e) => setCreateDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            중요도 <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="importance"
                value="1"
                checked={importanceLevel === 1}
                onChange={() => setImportanceLevel(1)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-red-600">매우 중요</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="importance"
                value="2"
                checked={importanceLevel === 2}
                onChange={() => setImportanceLevel(2)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-blue-600">중요</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="importance"
                value="3"
                checked={importanceLevel === 3}
                onChange={() => setImportanceLevel(3)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-black">보통</span>
            </label>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          대상 <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="target"
              value="all"
              checked={targetType === 'all'}
              onChange={() => setTargetType('all')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-black">전체 공지</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="target"
              value="portfolio"
              checked={targetType === 'portfolio'}
              onChange={() => setTargetType('portfolio')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-black">특정 포트폴리오</span>
          </label>
        </div>
      </div>
      
      {targetType === 'portfolio' && (
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            대상 포트폴리오 <span className="text-red-500">*</span>
          </label>
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <div className="w-6 h-6 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-600">포트폴리오 목록 로딩 중...</span>
            </div>
          ) : portfolios.length === 0 ? (
            <div className="text-sm text-gray-500">
              사용 가능한 포트폴리오가 없습니다.
            </div>
          ) : (
            <div>
              <div className="text-sm text-gray-500 mb-2">
                {selectedPortfolios.length > 0 ? (
                  <span>선택된 포트폴리오: {selectedPortfolios.length}개</span>
                ) : (
                  <span>포트폴리오를 선택해주세요</span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-md p-2">
                {portfolios.map((portfolio) => (
                  <label 
                    key={portfolio.id} 
                    className="flex items-center py-3 hover:bg-gray-50 px-3 rounded cursor-pointer border-b border-gray-200 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPortfolios.includes(portfolio.id)}
                      onChange={() => handlePortfolioChange(portfolio.id)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-black">{portfolio.name}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          내용 <span className="text-red-500">*</span>
        </label>
        <QuillEditor
          value={content}
          onChange={setContent}
          placeholder="공지사항 내용을 입력하세요"
        />
      </div>
      
      <div>
        <label htmlFor="linkUrl" className="block text-sm font-medium text-black mb-1">
          자세히 보기 링크
        </label>
        <input
          type="url"
          id="linkUrl"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
          placeholder="https://example.com"
        />
        <p className="mt-1 text-xs text-gray-500">
          링크를 추가하면 공지사항에 '자세히 보기' 버튼이 표시됩니다
        </p>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading}
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading}
        >
          {loading ? '처리 중...' : announcement ? '수정' : '등록'}
        </button>
      </div>
    </form>
  );
}