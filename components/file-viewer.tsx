'use client';

import { useState } from 'react';
import { FileDown, FileText, Image as ImageIcon, File, X, ExternalLink, Eye } from 'lucide-react';
import Image from 'next/image';

interface FileAttachment {
  id: number | string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

interface FileViewerProps {
  files: FileAttachment[];
  onDownload?: (file: FileAttachment) => void;
}

export default function FileViewer({ files, onDownload }: FileViewerProps) {
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  // 파일 아이콘 선택 함수
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // 파일 다운로드 핸들러
  const handleDownload = (file: FileAttachment) => {
    if (onDownload) {
      onDownload(file);
    } else {
      // 기본 다운로드 동작
      const link = document.createElement('a');
      link.href = file.fileUrl;
      link.download = file.fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 파일 미리보기 핸들러
  const handlePreview = (file: FileAttachment) => {
    if (file.fileType.startsWith('image/')) {
      setPreviewFile(file);
    } else if (file.fileType.includes('pdf')) {
      window.open(file.fileUrl, '_blank');
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  return (
    <div>
      {files.length === 0 ? (
        <p className="text-sm text-gray-500">첨부 파일이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center">
                {getFileIcon(file.fileType)}
                <span className="ml-2 text-sm truncate max-w-xs">{file.fileName}</span>
                {file.fileSize && (
                  <span className="ml-2 text-xs text-gray-500">
                    {formatFileSize(file.fileSize)}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {file.fileType.startsWith('image/') && (
                  <button
                    type="button"
                    onClick={() => handlePreview(file)}
                    className="text-gray-500 hover:text-blue-600"
                    title="미리보기"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="text-gray-500 hover:text-blue-600"
                  title="다운로드"
                >
                  <FileDown className="h-4 w-4" />
                </button>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-600"
                  title="새 탭에서 열기"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 이미지 미리보기 모달 */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{previewFile.fileName}</h3>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 rounded">
              <div className="relative max-h-[70vh] max-w-full">
                <Image
                  src={previewFile.fileUrl}
                  alt={previewFile.fileName}
                  width={800}
                  height={600}
                  className="object-contain"
                  style={{ maxHeight: '70vh' }}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => handleDownload(previewFile)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <FileDown className="h-4 w-4 mr-2" />
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 