'use client';

import { useState, useEffect } from 'react';
import { OverduePaymentNotice } from '@/lib/overdue-types';
import { Save, AlertTriangle, Info } from 'lucide-react';
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
}

export default function OverduePaymentNoticeComponent({
  initialNotice = null,
  isEditable = false,
  onSave,
}: OverduePaymentNoticeProps) {
  const [notice, setNotice] = useState<OverduePaymentNotice | null>(initialNotice);
  const [content, setContent] = useState<string>(initialNotice?.content || '');
  const [loading, setLoading] = useState<boolean>(!initialNotice);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialNotice && !isEditable) {
      fetchLatestNotice();
    }
  }, [initialNotice, isEditable]);

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
    } catch (err) {
      console.error('안내사항 저장 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (error && !isEditable) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>안내사항을 불러오는데 문제가 발생했습니다.</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!notice && !isEditable) {
    return (
      <div className="p-4 bg-gray-50 text-gray-700 rounded-md">
        <p>등록된 안내사항이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && isEditable && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {isEditable ? (
        <>
          <QuillEditor value={content} onChange={setContent} />
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </>
      ) : (
        <div 
          className="prose prose-sm max-w-none p-4 bg-blue-50 rounded-md"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
} 