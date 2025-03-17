'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertTriangle, CheckCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExcelOverdueData, OverduePaymentUploadResponse } from '@/lib/overdue-types';

interface ExcelUploaderProps {
  onUploadSuccess?: (response: OverduePaymentUploadResponse) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  title?: string;
  description?: string;
  successMessage?: string;
  errorMessage?: string;
}

export default function ExcelUploader({
  onUploadSuccess,
  acceptedFileTypes = ['.xlsx', '.xls', '.csv'],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  title = '엑셀 파일 업로드',
  description = '파일을 드래그하여 업로드하거나 클릭하여 파일을 선택하세요.',
  successMessage = '파일이 성공적으로 업로드되었습니다.',
  errorMessage = '파일 업로드 중 오류가 발생했습니다.',
}: ExcelUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      
      if (!selectedFile) return;
      
      // 파일 크기 검증
      if (selectedFile.size > maxFileSize) {
        setErrorDetails(`파일 크기가 너무 큽니다. 최대 ${maxFileSize / 1024 / 1024}MB까지 업로드 가능합니다.`);
        setUploadStatus('error');
        return;
      }
      
      // 파일 형식 검증
      const fileExtension = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;
      if (!acceptedFileTypes.includes(fileExtension)) {
        setErrorDetails(`지원하지 않는 파일 형식입니다. ${acceptedFileTypes.join(', ')} 형식만 업로드 가능합니다.`);
        setUploadStatus('error');
        return;
      }
      
      setFile(selectedFile);
      setUploadStatus('idle');
      setErrorDetails(null);
      
      try {
        setIsUploading(true);
        setProgress(10);
        
        // FormData 생성
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // 업로드 요청
        setProgress(30);
        
        // 세션 쿠키가 포함되도록 설정
        const response = await fetch('/api/overdue-payments/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            // Content-Type은 FormData를 사용할 때 자동으로 설정됨
            // 'Content-Type': 'multipart/form-data',
          },
        });
        
        setProgress(80);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '파일 업로드에 실패했습니다.');
        }
        
        const result: OverduePaymentUploadResponse = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setProgress(100);
        setUploadStatus('success');
        
        // 성공 콜백 호출
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
      } catch (error) {
        console.error('파일 업로드 오류:', error);
        setErrorDetails(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
        setUploadStatus('error');
      } finally {
        setIsUploading(false);
      }
    },
    [acceptedFileTypes, maxFileSize, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': acceptedFileTypes,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': acceptedFileTypes,
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const resetUploader = () => {
    setFile(null);
    setUploadStatus('idle');
    setErrorDetails(null);
    setProgress(0);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : uploadStatus === 'error'
            ? 'border-red-300 bg-red-50'
            : uploadStatus === 'success'
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        } ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-700">파일 업로드 중...</p>
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mt-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="flex flex-col items-center justify-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-700">{successMessage}</p>
            <p className="text-sm text-gray-500 mt-2">{file?.name}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetUploader();
              }}
              className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              다른 파일 업로드
            </button>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="flex flex-col items-center justify-center py-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium text-gray-700">{errorMessage}</p>
            {errorDetails && <p className="text-sm text-red-600 mt-2">{errorDetails}</p>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetUploader();
              }}
              className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              다시 시도
            </button>
          </div>
        ) : file ? (
          <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
            <div className="flex items-center">
              <FileSpreadsheet className="h-8 w-8 text-green-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetUploader();
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700">{title}</p>
            <p className="text-sm text-gray-500 mt-2">{description}</p>
            <p className="text-xs text-gray-400 mt-1">
              지원 형식: {acceptedFileTypes.join(', ')} / 최대 {maxFileSize / 1024 / 1024}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 