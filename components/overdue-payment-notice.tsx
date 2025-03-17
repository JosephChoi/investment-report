'use client';

import { useState, useEffect } from 'react';
import { OverduePaymentNotice } from '@/lib/overdue-types';
import { Save, AlertTriangle, Info, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';

// 서버 컴포넌트에서 Quill 에디터를 사용하기 위해 동적 임포트
const QuillEditor = dynamic(() => import('@/components/quill-editor'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded-md"></div>,
});

interface OverduePaymentNoticeProps {
  initialNotice?: OverduePaymentNotice | null;
  isEditable?: boolean;
  onSave?: (content: string) => Promise<void>;
  className?: string;
}

export default function OverduePaymentNoticeComponent({
  initialNotice = null,
  isEditable = false,
  onSave,
  className = '',
}: OverduePaymentNoticeProps) {
  const [notice, setNotice] = useState<OverduePaymentNotice | null>(initialNotice);
  const [content, setContent] = useState<string>(initialNotice?.content || (isEditable ? '<p>연체정보 관련 안내사항을 입력하세요.</p>' : ''));
  const [loading, setLoading] = useState<boolean>(!initialNotice && !isEditable);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!initialNotice && !isEditable) {
      fetchLatestNotice();
    }
  }, [initialNotice, isEditable]);

  useEffect(() => {
    if (initialNotice) {
      setNotice(initialNotice);
      setContent(initialNotice.content || '');
      setLoading(false);
    }
  }, [initialNotice]);

  const fetchLatestNotice = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/overdue-payment-notices/latest');
      
      if (!response.ok) {
        throw new Error('안내사항을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setNotice(data.data);
      if (data.data) {
        setContent(data.data.content);
      }
    } catch (err) {
      console.error('안내사항 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      setSaving(true);
      await onSave(content);
      setError(null);
      setSuccess(true);
    } catch (err) {
      console.error('안내사항 저장 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">연체정보 안내사항</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-600" />
          연체정보 안내사항
        </h2>
      </div>

      <div className="mb-4">
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

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">오류가 발생했습니다</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {isEditable ? (
        <>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <QuillEditor value={content} onChange={setContent} />
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {saving ? (
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
      ) : notice ? (
        <div 
          className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-md border border-gray-200"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">등록된 안내사항이 없습니다</p>
        </div>
      )}
    </div>
  );
}