'use client';

import { useState } from 'react';

interface ExampleFixProps {
  originalText: string;
  exampleFix: string;
  type: 'expression' | 'omission';
}

export default function ExampleFix({
  originalText,
  exampleFix,
  type,
}: ExampleFixProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 전파 방지
    try {
      await navigator.clipboard.writeText(exampleFix);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 API 실패 시 폴백
      const textArea = document.createElement('textarea');
      textArea.value = exampleFix;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // omission 타입인 경우 추가된 고지사항 부분 하이라이트
  const renderExampleFix = () => {
    if (type === 'omission' && exampleFix.includes('※')) {
      const parts = exampleFix.split('※');
      return (
        <>
          {parts[0]}
          <span className="bg-emerald-200 text-emerald-900 px-1 rounded">
            ※{parts.slice(1).join('※')}
          </span>
        </>
      );
    }
    return exampleFix;
  };

  return (
    <div
      className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          수정 예시
        </p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-white hover:bg-blue-100 rounded border border-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="수정 예시 복사"
        >
          {copied ? (
            <>
              <svg
                className="w-3.5 h-3.5 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-emerald-600">복사됨!</span>
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              복사
            </>
          )}
        </button>
      </div>

      {/* 원본 */}
      <div className="mb-2">
        <p className="text-[10px] text-gray-500 mb-1">원본:</p>
        <p className="text-xs sm:text-sm text-red-700 bg-red-50 px-2 py-1.5 rounded border border-red-200 break-words line-through decoration-red-400">
          {originalText}
        </p>
      </div>

      {/* 화살표 */}
      <div className="flex justify-center my-1">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>

      {/* 수정 */}
      <div>
        <p className="text-[10px] text-gray-500 mb-1">수정:</p>
        <p className="text-xs sm:text-sm text-emerald-800 bg-emerald-50 px-2 py-1.5 rounded border border-emerald-200 break-words">
          {renderExampleFix()}
        </p>
      </div>
    </div>
  );
}
