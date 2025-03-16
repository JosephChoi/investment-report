'use client';

import { useState, useEffect } from 'react';
import { OverduePaymentNotice } from '@/lib/overdue-types';
import { Save, AlertTriangle, Info } from 'lucide-react';
import dynamic from 'next/dynamic';

// Quill 에디터는 클라이언트 사이드에서만 로드
const QuillEditor = dynamic(() => import('@/components/quill-editor'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded-md"></div>,
});

interface OverduePaymentNoticeProps {
  notice?: OverduePaymentNotice | null;
  isEditable?: boolean;
  onSave?: (content: string) => Promise<void>;
}

export default function OverduePaymentNoticeComponent({
  notice,
  isEditable = false,
  onSave,
}: OverduePaymentNoticeProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (notice) {
      setContent(notice.content);
    } else if (isEditable) {
      setContent('<p>연체정보 관련 안내사항을 입력하세요.</p>');
    }
  }, [notice, isEditable]);

  const handleSave = async () => {
    if (!onSave) return;

    try {
      setLoading(true);
      setError(null);
      await onSave(content);
    } catch (err) {
      console.error('안내사항 저장 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isEditable && !notice) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2 text-gray-900">연체정보 안내사항</h2>
        <p className="text-gray-600 text-sm">
          {isEditable
            ? '고객에게 표시될 연체정보 관련 안내사항을 작성하세요.'
            : '연체정보 관련 안내사항입니다.'}
        </p>
      </div>

      {isEditable && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-sm flex items-start">
          <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">안내사항 작성 가이드</p>
            <p>고객이 대시보드에서 볼 수 있는 연체정보 관련 안내사항입니다.</p>
            <p>연체 해결 방법, 문의처 등의 정보를 포함하는 것이 좋습니다.</p>
          </div>
        </div>
      )}

      {isEditable ? (
        <>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <QuillEditor value={content} onChange={setContent} />
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">저장 중 오류가 발생했습니다</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  저장하기
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div 
          className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-md border border-gray-200"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
} 