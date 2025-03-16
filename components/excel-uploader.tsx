'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadIcon, FileIcon, XIcon, CheckIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExcelOverdueData, OverduePaymentUploadResponse } from '@/lib/overdue-types';

interface ExcelUploaderProps {
  onUploadSuccess?: (response: OverduePaymentUploadResponse) => void;
  onUploadError?: (error: string) => void;
}

export default function ExcelUploader({ onUploadSuccess, onUploadError }: ExcelUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<ExcelOverdueData[] | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const parseExcel = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ExcelOverdueData>(worksheet);
      
      // 미리보기 데이터는 최대 5개만 표시
      setPreviewData(jsonData.slice(0, 5));
    } catch (error) {
      console.error('엑셀 파일 파싱 오류:', error);
      alert('엑셀 파일 파싱 오류: 파일 형식이 올바르지 않습니다.');
      setFile(null);
      setPreviewData(null);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(10);

      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);

      // 업로드 요청
      const response = await fetch('/api/overdue-payments/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      setProgress(90);

      const result: OverduePaymentUploadResponse = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setProgress(100);
      alert(`업로드 성공: ${result.data?.recordCount}개의 연체정보가 업로드되었습니다.`);

      // 성공 콜백 호출
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      // 상태 초기화
      setTimeout(() => {
        setFile(null);
        setPreviewData(null);
        setUploading(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('업로드 오류:', error);
      alert(`업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);

      // 오류 콜백 호출
      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      }

      setUploading(false);
      setProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewData(null);
  };

  return (
    <div className="w-full space-y-4">
      <div className="border rounded-lg p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium">
              {isDragActive
                ? '파일을 여기에 놓으세요'
                : '연체정보 엑셀 파일을 드래그하거나 클릭하여 업로드하세요'}
            </p>
            <p className="text-sm text-gray-500">
              지원 형식: .xlsx, .xls (최대 10MB)
            </p>
          </div>
        </div>

        {file && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-gray-500">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              {!uploading && (
                <button
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {uploading && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {progress < 100
                    ? '업로드 중...'
                    : '업로드 완료'}
                </p>
              </div>
            )}
          </div>
        )}

        {previewData && previewData.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">미리보기 (최대 5개)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th
                        key={key}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-3 py-2 whitespace-nowrap">
                          {value?.toString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={uploadFile}
            disabled={!file || uploading}
            className={`px-4 py-2 rounded-md flex items-center space-x-1 ${
              !file || uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>업로드 중...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>업로드</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 