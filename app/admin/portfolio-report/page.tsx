'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function PortfolioReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [portfolioType, setPortfolioType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // 페이지 로드 시 포트폴리오 리포트 목록 가져오기
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('portfolio_reports')
          .select('*')
          .order('report_date', { ascending: false });

        if (error) throw error;
        setReports(data || []);
      } catch (error: any) {
        console.error('포트폴리오 리포트 조회 오류:', error);
        setError('포트폴리오 리포트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // 파일 타입 검증
      if (!selectedFile.type.includes('image/jpeg') && !selectedFile.type.includes('image/png')) {
        setError('JPG 또는 PNG 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 검증 (10MB 제한)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  // 파일 업로드 핸들러
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }
    
    if (!portfolioType) {
      setError('포트폴리오 유형을 입력해주세요.');
      return;
    }
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      formData.append('portfolioType', portfolioType);
      
      // API 호출
      const response = await fetch('/api/admin/portfolio-report/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '업로드 중 오류가 발생했습니다.');
      }
      
      setSuccess('포트폴리오 리포트가 성공적으로 업로드되었습니다.');
      setFile(null);
      setPortfolioType('');
      
      // 리포트 목록 새로고침
      const { data, error } = await supabase
        .from('portfolio_reports')
        .select('*')
        .order('report_date', { ascending: false });
      
      if (error) throw error;
      setReports(data || []);
      
    } catch (error: any) {
      console.error('업로드 오류:', error);
      setError(error.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 리포트 삭제 핸들러
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 리포트를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('portfolio_reports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 리포트 목록 새로고침
      setReports(reports.filter(report => report.id !== id));
      setSuccess('리포트가 성공적으로 삭제되었습니다.');
      
    } catch (error: any) {
      console.error('삭제 오류:', error);
      setError('리포트 삭제 중 오류가 발생했습니다.');
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">포트폴리오 리포트 관리</h1>
      
      {/* 업로드 폼 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">리포트 업로드</h2>
        
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-md">
            {success}
          </div>
        )}
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="portfolioType" className="block text-sm font-medium text-gray-700 mb-1">
              포트폴리오 유형
            </label>
            <input
              id="portfolioType"
              type="text"
              value={portfolioType}
              onChange={(e) => setPortfolioType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              placeholder="예: 밸런스드 인컴(NTF)"
              required
            />
          </div>
          
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              리포트 파일 (JPG/PNG)
            </label>
            <input
              id="file"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              파일명에 날짜(YYYY-MM-DD)를 포함해주세요. 예: 밸런스드_2023-05-31.jpg
            </p>
          </div>
          
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </form>
      </div>
      
      {/* 리포트 목록 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">리포트 목록</h2>
        
        {loading ? (
          <p>로딩 중...</p>
        ) : reports.length === 0 ? (
          <p>등록된 리포트가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg overflow-hidden">
                <div className="relative h-48 w-full">
                  <Image
                    src={report.report_url}
                    alt={report.portfolio_type}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{report.portfolio_type}</h3>
                  <p className="text-sm text-gray-600">{formatDate(report.report_date)}</p>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 