import { useState, useEffect } from 'react';
import { Announcement, AnnouncementFormData, Portfolio } from '@/lib/types';
import QuillEditor from './quill-editor';
import FileUploader from './file-uploader';

interface AnnouncementFormProps {
  announcement?: Announcement;
  onSubmit: (formData: AnnouncementFormData, files?: File[]) => Promise<void>;
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
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 포트폴리오 목록 조회
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await fetch('/api/portfolios');
        
        if (!response.ok) {
          throw new Error('포트폴리오 목록을 불러오는데 실패했습니다.');
        }
        
        const { data } = await response.json();
        setPortfolios(data);
      } catch (err) {
        console.error('포트폴리오 목록 조회 중 오류 발생:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
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
      if (!title.trim()) {
        throw new Error('제목을 입력해주세요.');
      }
      
      if (!content.trim()) {
        throw new Error('내용을 입력해주세요.');
      }
      
      if (targetType === 'portfolio' && selectedPortfolios.length === 0) {
        throw new Error('대상 포트폴리오를 선택해주세요.');
      }
      
      // 폼 데이터 생성
      const formData: AnnouncementFormData = {
        title: title.trim(),
        content,
        importance_level: importanceLevel,
        target_type: targetType,
        target_portfolios: targetType === 'portfolio' ? selectedPortfolios : []
      };
      
      // 폼 제출
      await onSubmit(formData, files.length > 0 ? files : undefined);
      
      // 폼 초기화
      if (!announcement) {
        setTitle('');
        setContent('');
        setImportanceLevel(3);
        setTargetType('all');
        setSelectedPortfolios([]);
        setFiles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

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

  // 파일 업로드 핸들러
  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="공지사항 제목을 입력하세요"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-600">보통</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <span className="ml-2 text-sm">전체 공지</span>
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
            <span className="ml-2 text-sm">특정 포트폴리오</span>
          </label>
        </div>
      </div>
      
      {targetType === 'portfolio' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            대상 포트폴리오 <span className="text-red-500">*</span>
          </label>
          {portfolios.length === 0 ? (
            <div className="text-gray-500 text-sm">포트폴리오가 없습니다.</div>
          ) : (
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {portfolios.map((portfolio) => (
                <label key={portfolio.id} className="flex items-center py-1">
                  <input
                    type="checkbox"
                    checked={selectedPortfolios.includes(portfolio.id)}
                    onChange={() => handlePortfolioChange(portfolio.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm">{portfolio.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          내용 <span className="text-red-500">*</span>
        </label>
        <QuillEditor
          value={content}
          onChange={setContent}
          placeholder="공지사항 내용을 입력하세요"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          첨부 파일
        </label>
        <FileUploader
          onFilesSelected={handleFileChange}
          maxFiles={5}
          maxSizeInMB={10}
          acceptedFileTypes=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        />
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