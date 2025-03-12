'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, Link as LinkIcon, Image, Code, Quote, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = '내용을 입력하세요...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isComposing, setIsComposing] = useState(false); // 한글 입력 상태 추적
  const [lastHtml, setLastHtml] = useState(value); // 마지막으로 저장된 HTML
  const [isFocused, setIsFocused] = useState(false); // 포커스 상태 추적
  const [editorContent, setEditorContent] = useState(value); // 에디터 내용 상태 추가
  const [debugInfo, setDebugInfo] = useState<string>(''); // 디버깅 정보

  // 디버깅 로그 함수
  const logDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => `${prev}\n${message}`);
  };

  // 초기 HTML 설정
  useEffect(() => {
    if (editorRef.current) {
      // 에디터 내용이 변경되었을 때만 업데이트
      if (value !== editorContent) {
        editorRef.current.innerHTML = value;
        setEditorContent(value);
        setLastHtml(value);
      }
      
      // placeholder 속성 추가
      if (editorRef.current.getAttribute('data-placeholder') === null) {
        editorRef.current.setAttribute('data-placeholder', placeholder);
      }
    }
  }, [value, placeholder, editorContent]);

  // 에디터 내용이 변경될 때 부모 컴포넌트에 알림
  const handleInput = () => {
    if (editorRef.current && !isComposing) {
      const newHtml = editorRef.current.innerHTML;
      
      // 내용이 변경된 경우에만 업데이트
      if (newHtml !== lastHtml) {
        setLastHtml(newHtml);
        setEditorContent(newHtml);
        onChange(newHtml);
        logDebug(`내용 변경: ${newHtml.substring(0, 50)}...`);
      }
    }
  };

  // 한글 입력 시작 이벤트 핸들러
  const handleCompositionStart = () => {
    logDebug('한글 입력 시작');
    setIsComposing(true);
  };

  // 한글 입력 완료 이벤트 핸들러
  const handleCompositionEnd = () => {
    logDebug('한글 입력 완료');
    
    // 약간의 지연을 두어 브라우저가 조합을 완료할 시간을 줌
    setTimeout(() => {
      setIsComposing(false);
      
      // 입력이 완료되면 변경 내용 전달
      if (editorRef.current) {
        const newHtml = editorRef.current.innerHTML;
        
        // 내용이 변경된 경우에만 업데이트
        if (newHtml !== lastHtml) {
          setLastHtml(newHtml);
          setEditorContent(newHtml);
          onChange(newHtml);
          logDebug(`입력 완료 후 내용: ${newHtml.substring(0, 50)}...`);
        }
      }
    }, 100); // 지연 시간 더 증가
  };

  // 키 입력 이벤트 핸들러 - 한글 입력 문제 해결을 위한 추가 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 한글 입력 중에는 특정 키 이벤트 처리를 방지
    if (isComposing) {
      logDebug(`한글 입력 중 키 이벤트: ${e.key}`);
      // 한글 입력 중 Enter 키 처리 방지
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    }
  };

  // 포커스 이벤트 핸들러
  const handleFocus = () => {
    setIsFocused(true);
    logDebug('에디터 포커스');
    // 에디터가 포커스를 받으면 스타일 적용
    if (editorRef.current) {
      editorRef.current.style.color = 'black';
    }
  };

  // 블러 이벤트 핸들러
  const handleBlur = () => {
    setIsFocused(false);
    logDebug('에디터 블러');
    // 한글 입력 중이었다면 입력 완료 처리
    if (isComposing) {
      handleCompositionEnd();
    }
  };

  // 서식 적용 함수 - 개선된 버전
  const applyFormat = (command: string, value: string = '') => {
    logDebug(`서식 적용: ${command}, 값: ${value}`);
    
    // 에디터에 포커스가 없으면 포커스 설정
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
    
    // 현재 선택 영역 확인
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      logDebug('선택 영역 없음');
      return;
    }
    
    try {
      // execCommand 실행
      const result = document.execCommand(command, false, value);
      logDebug(`execCommand 결과: ${result}`);
      
      // 내용 변경 처리
      handleInput();
      
      // 포커스 유지
      editorRef.current?.focus();
    } catch (error) {
      logDebug(`서식 적용 오류: ${error}`);
    }
  };

  // 텍스트 정렬 적용 - 개선된 버전
  const applyAlignment = (alignment: string) => {
    logDebug(`정렬 적용: ${alignment}`);
    
    // 에디터에 포커스가 없으면 포커스 설정
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      logDebug('선택 영역 없음');
      return;
    }
    
    try {
      // 먼저 블록 요소로 감싸기
      document.execCommand('formatBlock', false, '<div>');
      
      const range = selection.getRangeAt(0);
      const parentElement = range.commonAncestorContainer.parentElement;
      
      if (parentElement) {
        // 가장 가까운 블록 요소 찾기
        let blockElement = parentElement;
        while (blockElement && 
               blockElement.nodeType === Node.ELEMENT_NODE && 
               getComputedStyle(blockElement as Element).display !== 'block' &&
               blockElement !== editorRef.current) {
          blockElement = blockElement.parentElement as HTMLElement;
        }
        
        // 블록 요소가 에디터 자체가 아니라면 정렬 적용
        if (blockElement && blockElement !== editorRef.current) {
          (blockElement as HTMLElement).style.textAlign = alignment;
          logDebug(`정렬 적용 성공: ${blockElement.tagName}`);
        } else {
          // 블록 요소를 찾지 못했다면 새로운 div 생성
          document.execCommand('formatBlock', false, '<div>');
          setTimeout(() => {
            const newBlockElement = selection.getRangeAt(0).commonAncestorContainer.parentElement;
            if (newBlockElement && newBlockElement !== editorRef.current) {
              (newBlockElement as HTMLElement).style.textAlign = alignment;
              logDebug(`새 블록에 정렬 적용: ${newBlockElement.tagName}`);
            }
          }, 0);
        }
      }
      
      // 내용 변경 처리
      handleInput();
      
      // 포커스 유지
      editorRef.current?.focus();
    } catch (error) {
      logDebug(`정렬 적용 오류: ${error}`);
    }
  };

  // 링크 삽입
  const insertLink = () => {
    if (linkUrl) {
      logDebug(`링크 삽입: ${linkUrl}`);
      
      const text = linkText || linkUrl;
      const linkHtml = `<a href="${linkUrl}" target="_blank">${text}</a>`;
      
      // 에디터에 포커스가 없으면 포커스 설정
      if (editorRef.current && document.activeElement !== editorRef.current) {
        editorRef.current.focus();
      }
      
      try {
        document.execCommand('insertHTML', false, linkHtml);
        handleInput();
        setShowLinkForm(false);
        setLinkUrl('');
        setLinkText('');
        editorRef.current?.focus();
      } catch (error) {
        logDebug(`링크 삽입 오류: ${error}`);
      }
    }
  };

  // 이미지 삽입 (파일 선택 다이얼로그 열기)
  const handleImageClick = () => {
    logDebug('이미지 삽입 시작');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        logDebug(`이미지 선택됨: ${file.name}`);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          // 에디터에 포커스가 없으면 포커스 설정
          if (editorRef.current && document.activeElement !== editorRef.current) {
            editorRef.current.focus();
          }
          
          const img = `<img src="${e.target?.result}" alt="${file.name}" style="max-width: 100%;" />`;
          try {
            document.execCommand('insertHTML', false, img);
            handleInput();
            logDebug('이미지 삽입 성공');
          } catch (error) {
            logDebug(`이미지 삽입 오류: ${error}`);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // 붙여넣기 이벤트 처리 - 서식 없는 텍스트만 붙여넣기
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    logDebug('붙여넣기 이벤트');
    
    // 클립보드에서 텍스트 가져오기
    const text = e.clipboardData.getData('text/plain');
    logDebug(`붙여넣기 텍스트: ${text.substring(0, 50)}...`);
    
    // 서식 없는 텍스트 삽입
    try {
      document.execCommand('insertText', false, text);
    } catch (error) {
      logDebug(`붙여넣기 오류: ${error}`);
      // 대체 방법으로 시도
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          handleInput();
        }
      }
    }
  };

  // 한글 입력 문제 해결을 위한 추가 처리
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // 한글 입력 관련 이벤트 리스너 추가
    const handleNativeInput = (e: Event) => {
      if (!isComposing) {
        const newHtml = editor.innerHTML;
        if (newHtml !== lastHtml) {
          setLastHtml(newHtml);
          setEditorContent(newHtml);
          onChange(newHtml);
        }
      }
    };

    // 이벤트 리스너 등록
    editor.addEventListener('input', handleNativeInput);

    // 클린업 함수
    return () => {
      editor.removeEventListener('input', handleNativeInput);
    };
  }, [isComposing, lastHtml, onChange]);

  // 에디터 초기화 및 한글 입력 문제 해결을 위한 추가 설정
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    logDebug('에디터 초기화');
    
    // 에디터 초기화
    editor.innerHTML = value;
    setLastHtml(value);
    setEditorContent(value);

    // 한글 입력 문제 해결을 위한 스타일 설정
    // TypeScript 오류 해결을 위해 any 타입으로 캐스팅
    const editorStyle = editor.style as any;
    
    // 한글 입력을 위한 핵심 설정
    editorStyle.webkitUserModify = 'read-write-plaintext-only';
    editor.style.webkitUserSelect = 'text';
    
    // 기본 스타일 설정
    editor.style.wordBreak = 'normal';
    editor.style.overflowWrap = 'break-word';
    editor.style.lineHeight = '1.5';
    editor.style.color = 'black';
    
    // 방향 설정 - 한글 입력을 위한 최적화
    editor.style.direction = 'ltr';
    editor.style.textAlign = 'left';
    editor.dir = 'ltr';
    editor.setAttribute('dir', 'ltr');
    editor.style.unicodeBidi = 'normal';
    
    // 한글 입력 문제 해결을 위한 추가 설정
    editor.setAttribute('lang', 'ko');
    editor.setAttribute('spellcheck', 'false');
    
    // 한글 입력 시 역순 문제 해결을 위한 추가 설정
    editor.style.writingMode = 'horizontal-tb';
    
    // contentEditable 속성 확인
    if (!editor.isContentEditable) {
      editor.contentEditable = 'true';
      logDebug('contentEditable 속성 설정됨');
    }
    
    // 모든 자식 요소에 방향 설정 적용
    const applyDirectionToChildren = () => {
      const elements = editor.querySelectorAll('*');
      elements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.direction = 'ltr';
        htmlEl.style.textAlign = 'left';
        htmlEl.dir = 'ltr';
        htmlEl.setAttribute('dir', 'ltr');
        htmlEl.style.unicodeBidi = 'normal';
        htmlEl.style.writingMode = 'horizontal-tb';
      });
    };
    
    applyDirectionToChildren();
    
    // MutationObserver를 사용하여 DOM 변경 시 방향 설정 적용
    const observer = new MutationObserver(() => {
      applyDirectionToChildren();
    });
    
    observer.observe(editor, { 
      childList: true, 
      subtree: true,
      attributes: true,
      characterData: true
    });
    
    // 한글 입력 문제 해결을 위한 추가 이벤트 리스너
    const handleBeforeInput = (e: InputEvent) => {
      // 한글 입력 중에는 기본 동작 유지
      if (isComposing) {
        return;
      }
    };
    
    // document.execCommand 지원 확인
    logDebug(`document.execCommand 지원 여부: ${document.queryCommandSupported('bold')}`);
    
    editor.addEventListener('beforeinput', handleBeforeInput);
    
    return () => {
      observer.disconnect();
      editor.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, [value]);

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-300">
        <button
          type="button"
          onClick={() => applyFormat('bold')}
          className="p-1 rounded hover:bg-gray-200"
          title="굵게"
        >
          <Bold className="h-5 w-5 text-gray-800" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('italic')}
          className="p-1 rounded hover:bg-gray-200"
          title="기울임"
        >
          <Italic className="h-5 w-5 text-gray-800" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('insertUnorderedList')}
          className="p-1 rounded hover:bg-gray-200"
          title="목록"
        >
          <List className="h-5 w-5 text-gray-800" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('formatBlock', '<pre>')}
          className="p-1 rounded hover:bg-gray-200"
          title="코드"
        >
          <Code className="h-5 w-5 text-gray-800" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('formatBlock', '<blockquote>')}
          className="p-1 rounded hover:bg-gray-200"
          title="인용구"
        >
          <Quote className="h-5 w-5 text-gray-800" />
        </button>
        <div className="h-5 border-l border-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => applyAlignment('left')}
          className="p-1 rounded hover:bg-gray-200"
          title="왼쪽 정렬"
        >
          <AlignLeft className="h-5 w-5 text-gray-800" />
        </button>
        <button
          type="button"
          onClick={() => applyAlignment('center')}
          className="p-1 rounded hover:bg-gray-200"
          title="가운데 정렬"
        >
          <AlignCenter className="h-5 w-5 text-gray-800" />
        </button>
        <button
          type="button"
          onClick={() => applyAlignment('right')}
          className="p-1 rounded hover:bg-gray-200"
          title="오른쪽 정렬"
        >
          <AlignRight className="h-5 w-5 text-gray-800" />
        </button>
        <div className="h-5 border-l border-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => setShowLinkForm(true)}
          className="p-1 rounded hover:bg-gray-200"
          title="링크 삽입"
        >
          <LinkIcon className="h-5 w-5 text-gray-800" />
        </button>
        <button
          type="button"
          onClick={handleImageClick}
          className="p-1 rounded hover:bg-gray-200"
          title="이미지 삽입"
        >
          <Image className="h-5 w-5 text-gray-800" />
        </button>
      </div>

      {/* 링크 삽입 폼 */}
      {showLinkForm && (
        <div className="p-3 bg-gray-50 border-b border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm text-black"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">표시 텍스트</label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm text-black"
                placeholder="링크 텍스트"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowLinkForm(false)}
              className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
            >
              취소
            </button>
            <button
              type="button"
              onClick={insertLink}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              삽입
            </button>
          </div>
        </div>
      )}

      {/* 에디터 영역 */}
      <div
        ref={editorRef}
        contentEditable
        className={`p-3 min-h-[200px] focus:outline-none text-black empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 font-normal text-base ${isFocused ? 'focused' : ''}`}
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        dir="ltr"
        lang="ko"
        spellCheck={false}
        style={{ 
          color: 'black', 
          fontSize: '16px', 
          lineHeight: '1.5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'normal',
          WebkitUserModify: 'read-write-plaintext-only',
          wordBreak: 'normal',
          overflowWrap: 'break-word',
          writingMode: 'horizontal-tb'
        }}
      ></div>

      {/* 디버그 정보 (개발 중에만 표시) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 bg-gray-100 border-t border-gray-300 text-xs font-mono text-gray-700 max-h-32 overflow-auto">
          <div>디버그 정보:</div>
          <pre>{debugInfo}</pre>
        </div>
      )}

      <style jsx global>{`
        [contenteditable] {
          -webkit-user-modify: read-write-plaintext-only;
          -webkit-user-select: text;
          color: black !important;
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: normal !important;
          word-break: normal;
          overflow-wrap: break-word;
          writing-mode: horizontal-tb !important;
        }
        [contenteditable]:focus {
          outline: none;
        }
        [contenteditable] p {
          color: black !important;
          margin-bottom: 0.5rem;
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: normal !important;
          writing-mode: horizontal-tb !important;
        }
        [contenteditable] a {
          color: #3b82f6 !important;
          text-decoration: underline;
        }
        [contenteditable] * {
          color: black !important;
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: normal !important;
          writing-mode: horizontal-tb !important;
        }
        [contenteditable] b, [contenteditable] strong {
          font-weight: bold !important;
        }
        [contenteditable] i, [contenteditable] em {
          font-style: italic !important;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
        }
        [contenteditable] pre {
          background-color: #f3f4f6;
          padding: 0.75rem;
          border-radius: 0.25rem;
          font-family: monospace;
          white-space: pre-wrap;
        }
        [contenteditable] ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          margin: 0.5rem 0;
        }
        .focused {
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
} 