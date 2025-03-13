'use client';

import { useState, useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function QuillEditor({ value, onChange, placeholder = '내용을 입력하세요...' }: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<any>(null);
  const [editorValue, setEditorValue] = useState(value);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 실행되도록 설정
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Quill 에디터 초기화
  useEffect(() => {
    if (!isClient || !editorRef.current) return;
    
    // 이미 초기화된 경우 중복 초기화 방지
    if (quillInstanceRef.current) return;

    // Quill 모듈 동적 임포트
    const initQuill = async () => {
      try {
        const Quill = (await import('quill')).default;
        
        // 이미지 핸들러 등록
        const imageHandler = () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            if (input.files && input.files[0]) {
              const file = input.files[0];
              const reader = new FileReader();
              
              reader.onload = (e) => {
                const quill = quillInstanceRef.current;
                if (quill) {
                  const range = quill.getSelection();
                  const position = range ? range.index : 0;
                  quill.insertEmbed(position, 'image', e.target?.result);
                }
              };
              
              reader.readAsDataURL(file);
            }
          };
        };

        // Quill 에디터 설정
        const quill = new Quill(editorRef.current as HTMLElement, {
          theme: 'snow',
          placeholder: placeholder,
          modules: {
            toolbar: {
              container: [
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                [{ font: [] }],
                [{ size: ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ color: [] }, { background: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ align: [] }],
                ['link', 'image'],
                ['clean'],
              ],
              handlers: {
                image: imageHandler,
              },
            },
            clipboard: {
              matchVisual: false, // 붙여넣기 시 서식 유지 방지
            },
          },
          formats: [
            'header',
            'font',
            'size',
            'bold',
            'italic',
            'underline',
            'strike',
            'color',
            'background',
            'list',
            'align',
            'link',
            'image',
          ]
        });

        // 초기 내용 설정
        if (value) {
          quill.root.innerHTML = value;
        }

        // 내용 변경 이벤트 핸들러
        quill.on('text-change', () => {
          const html = quill.root.innerHTML;
          setEditorValue(html);
          onChange(html);
        });

        // 한글 입력 문제 해결을 위한 추가 설정
        const editorElement = quill.root;
        editorElement.style.direction = 'ltr';
        editorElement.style.textAlign = 'left';
        editorElement.setAttribute('dir', 'ltr');
        editorElement.style.unicodeBidi = 'normal';
        editorElement.setAttribute('lang', 'ko');
        editorElement.style.writingMode = 'horizontal-tb';

        // 인스턴스 저장
        quillInstanceRef.current = quill;
        
        // 포커스 설정
        setTimeout(() => {
          quill.focus();
        }, 100);
      } catch (error) {
        console.error('Quill 초기화 오류:', error);
      }
    };

    initQuill();

    // 클린업 함수
    return () => {
      if (quillInstanceRef.current) {
        // 필요한 클린업 작업 수행
        quillInstanceRef.current = null;
      }
    };
  }, [isClient, placeholder]);

  // 부모로부터 받은 value가 변경되면 에디터 내용 업데이트
  useEffect(() => {
    if (isClient && quillInstanceRef.current && value !== editorValue) {
      quillInstanceRef.current.root.innerHTML = value;
      setEditorValue(value);
    }
  }, [value, isClient, editorValue]);

  // 로딩 상태 표시
  if (!isClient) {
    return (
      <div className="h-[200px] border border-gray-300 rounded-md p-3 bg-white">
        <span className="text-black">에디터 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="quill-editor-container">
      {/* 에디터 컨테이너 */}
      <div ref={editorRef} style={{ height: '250px', minWidth: '800px' }}></div>
      
      {/* 스타일 */}
      <style jsx global>{`
        .quill-editor-container {
          border-radius: 0.375rem;
          overflow: hidden;
          width: 100%;
        }
        .quill-editor-container .ql-editor {
          min-height: 200px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          color: #000000;
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: normal !important;
          background-color: white;
        }
        .quill-editor-container .ql-editor p {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: normal !important;
          color: #000000;
        }
        .quill-editor-container .ql-snow .ql-editor h1 {
          font-size: 2em;
          font-weight: bold;
          color: #000000;
        }
        .quill-editor-container .ql-snow .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          color: #000000;
        }
        .quill-editor-container .ql-snow .ql-editor h3 {
          font-size: 1.17em;
          font-weight: bold;
          color: #000000;
        }
        .quill-editor-container .ql-toolbar {
          background-color: white;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
        }
        .quill-editor-container .ql-toolbar .ql-formats {
          margin-right: 10px;
        }
        .quill-editor-container .ql-container {
          background-color: white;
        }
      `}</style>
    </div>
  );
} 