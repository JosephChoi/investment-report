'use client';

import { useState, useRef } from 'react';
import { FileUp, X, FileText, Image as ImageIcon, File } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
  maxSizeInMB?: number;
}

export default function FileUploader({
  onFilesSelected,
  maxFiles = 5,
  acceptedFileTypes = '*',
  maxSizeInMB = 10
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  // 파일 유효성 검사
  const validateFiles = (fileList: File[]): { valid: File[], invalid: { file: File, reason: string }[] } => {
    const valid: File[] = [];
    const invalid: { file: File, reason: string }[] = [];

    for (const file of fileList) {
      // 파일 크기 검사
      if (file.size > maxSizeInBytes) {
        invalid.push({
          file,
          reason: `파일 크기가 너무 큽니다 (최대 ${maxSizeInMB}MB)`
        });
        continue;
      }

      // 파일 타입 검사 (acceptedFileTypes가 '*'가 아닌 경우)
      if (acceptedFileTypes !== '*') {
        const fileTypes = acceptedFileTypes.split(',').map(type => type.trim());
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const mimeType = file.type;

        const isValidType = fileTypes.some(type => {
          if (type.startsWith('.')) {
            // 확장자로 검사
            return `.${fileExtension}` === type;
          } else {
            // MIME 타입으로 검사
            return mimeType.includes(type);
          }
        });

        if (!isValidType) {
          invalid.push({
            file,
            reason: '지원하지 않는 파일 형식입니다'
          });
          continue;
        }
      }

      valid.push(file);
    }

    return { valid, invalid };
  };

  // 파일 처리 함수
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList);
    
    // 최대 파일 개수 검사
    if (files.length + newFiles.length > maxFiles) {
      setError(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
      return;
    }

    // 파일 유효성 검사
    const { valid, invalid } = validateFiles(newFiles);

    if (invalid.length > 0) {
      setError(`일부 파일이 유효하지 않습니다: ${invalid.map(item => `${item.file.name} (${item.reason})`).join(', ')}`);
    } else {
      setError(null);
    }

    if (valid.length > 0) {
      const updatedFiles = [...files, ...valid];
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // 파일 삭제 핸들러
  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
    setError(null);
  };

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleFiles(e.dataTransfer.files);
  };

  // 파일 아이콘 선택 함수
  const getFileIcon = (file: File) => {
    const type = file.type;
    
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="w-full">
      {/* 드래그 앤 드롭 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <FileUp className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 mb-1">
          파일을 드래그하여 업로드하거나 클릭하여 파일을 선택하세요
        </p>
        <p className="text-xs text-gray-400">
          최대 {maxFiles}개 파일, 각 {maxSizeInMB}MB 이하
          {acceptedFileTypes !== '*' && ` (${acceptedFileTypes})`}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedFileTypes}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 선택된 파일 목록 */}
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">선택된 파일 ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex items-center">
                  {getFileIcon(file)}
                  <span className="ml-2 text-sm truncate max-w-xs">{file.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {(file.size / 1024).toFixed(0)}KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 