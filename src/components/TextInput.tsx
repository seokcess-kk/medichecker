'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Violation } from '@/domain/verification/model';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  // 하이라이트 모드 관련 props
  highlightMode?: boolean;
  violations?: Violation[];
  onViolationClick?: (violation: Violation) => void;
  onEditClick?: () => void;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'bg-red-100 border-red-400 text-red-800';
  if (confidence >= 60) return 'bg-yellow-100 border-yellow-400 text-yellow-800';
  return 'bg-gray-100 border-gray-400 text-gray-700';
}

function getConfidenceColorHex(confidence: number): string {
  if (confidence >= 90) return '#DC2626';
  if (confidence >= 60) return '#F59E0B';
  return '#9CA3AF';
}

interface TextSegment {
  text: string;
  violation?: Violation;
  start: number;
  end: number;
}

function HighlightedTextView({
  text,
  violations,
  onViolationClick,
}: {
  text: string;
  violations: Violation[];
  onViolationClick?: (violation: Violation) => void;
}) {
  // highlightRanges가 있는 위반 항목들을 위치 기반으로 정렬
  const highlightableViolations: Array<{ violation: Violation; range: [number, number] }> = [];

  violations.forEach(v => {
    if (v.highlightRanges && v.highlightRanges.length > 0) {
      v.highlightRanges.forEach(range => {
        highlightableViolations.push({ violation: v, range });
      });
    }
  });

  // 시작 위치 기준 정렬
  highlightableViolations.sort((a, b) => a.range[0] - b.range[0]);

  // 겹치는 범위 제거
  const mergedRanges = highlightableViolations.filter((item, index) => {
    if (index === 0) return true;
    const prev = highlightableViolations[index - 1];
    return item.range[0] >= prev.range[1];
  });

  // 텍스트를 세그먼트로 분할
  const segments: TextSegment[] = [];
  let lastEnd = 0;

  mergedRanges.forEach(({ violation, range }) => {
    const [start, end] = range;

    // 범위 유효성 검사
    if (start < 0 || end > text.length || start >= end) return;

    // 이전 끝과 현재 시작 사이의 일반 텍스트
    if (start > lastEnd) {
      segments.push({
        text: text.slice(lastEnd, start),
        start: lastEnd,
        end: start,
      });
    }

    // 위반 텍스트
    segments.push({
      text: text.slice(start, end),
      violation,
      start,
      end,
    });

    lastEnd = end;
  });

  // 마지막 남은 텍스트
  if (lastEnd < text.length) {
    segments.push({
      text: text.slice(lastEnd),
      start: lastEnd,
      end: text.length,
    });
  }

  // 위반이 없으면 원본 텍스트 표시
  if (segments.length === 0) {
    segments.push({
      text,
      start: 0,
      end: text.length,
    });
  }

  // omission 위반 개수
  const omissionCount = violations.filter(v => v.type === 'omission').length;

  return (
    <div>
      {/* 누락 위반 안내 */}
      {omissionCount > 0 && (
        <div className="mb-3 p-2 bg-amber-50 rounded border border-amber-200">
          <p className="text-[10px] sm:text-xs text-amber-700 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>누락 위반 {omissionCount}건</strong> - 필수 고지사항 미포함
            </span>
          </p>
        </div>
      )}
      <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-gray-800">
        {segments.map((segment, index) => {
          if (segment.violation) {
            const colorClass = getConfidenceColor(segment.violation.confidence);
            const borderColor = getConfidenceColorHex(segment.violation.confidence);
            return (
              <span
                key={index}
                onClick={() => onViolationClick?.(segment.violation!)}
                className={`
                  ${colorClass}
                  px-0.5 sm:px-1 py-0.5 rounded border-b-2 cursor-pointer
                  hover:opacity-80 transition-opacity
                `}
                style={{ borderBottomColor: borderColor }}
                title={`${segment.violation.article} (${segment.violation.confidence}%)`}
              >
                {segment.text}
              </span>
            );
          }
          return <span key={index}>{segment.text}</span>;
        })}
      </div>
    </div>
  );
}

export default function TextInput({
  value,
  onChange,
  disabled = false,
  placeholder = '검증할 광고 텍스트를 붙여넣기 하거나 직접 입력하세요…',
  highlightMode = false,
  violations = [],
  onViolationClick,
  onEditClick,
}: TextInputProps) {
  const [charCount, setCharCount] = useState(value.length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current && !highlightMode) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 200), 400);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value, highlightMode]);

  // charCount 동기화
  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      setCharCount(newValue.length);
    },
    [onChange]
  );

  const handlePaste = useCallback(
    async () => {
      try {
        const text = await navigator.clipboard.readText();
        onChange(text);
        setCharCount(text.length);
      } catch (err) {
        console.error('클립보드 읽기 실패:', err);
      }
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 h-full">
      <div className="flex items-center justify-between">
        <label htmlFor="ad-text-input" className="text-xs sm:text-sm font-medium text-gray-700">
          광고 텍스트
        </label>
        {highlightMode ? (
          <button
            type="button"
            onClick={onEditClick}
            className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-md text-white transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            수정하기
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePaste}
            disabled={disabled}
            className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            붙여넣기
          </button>
        )}
      </div>

      {highlightMode ? (
        <div className="flex-1 w-full min-h-[200px] max-h-[400px] p-3 sm:p-4 border border-gray-300 rounded-lg bg-gray-50 overflow-y-auto">
          {/* 하이라이트 범례 */}
          <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 mb-3 pb-2 border-b border-gray-200">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#FEE2E2' }} />
              90%+
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#FEF3C7' }} />
              60~89%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#F3F4F6' }} />
              40~59%
            </span>
          </div>
          <HighlightedTextView
            text={value}
            violations={violations}
            onViolationClick={onViolationClick}
          />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id="ad-text-input"
          name="adText"
          autoComplete="off"
          spellCheck="false"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 w-full min-h-[200px] max-h-[400px] p-3 sm:p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base text-gray-900 placeholder:text-gray-400 overflow-y-auto"
        />
      )}

      <div className="flex justify-between text-[10px] sm:text-xs text-gray-500">
        <span>최대 3,000자 권장</span>
        <span
          className={charCount > 3000 ? 'text-red-500 font-medium' : ''}
        >
          {charCount.toLocaleString()}자
        </span>
      </div>
    </div>
  );
}
