'use client';

import { Violation } from '@/domain/verification/model';

interface ViolationHighlightProps {
  text: string;
  violations: Violation[];
  onViolationClick?: (violation: Violation) => void;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'bg-red-100 border-red-400 text-red-800';
  if (confidence >= 60) return 'bg-yellow-100 border-yellow-400 text-yellow-800';
  return 'bg-gray-100 border-gray-400 text-gray-700';
}

function getConfidenceColorHex(confidence: number): string {
  if (confidence >= 90) return '#EF4444';
  if (confidence >= 60) return '#F59E0B';
  return '#9CA3AF';
}

interface TextSegment {
  text: string;
  violation?: Violation;
  start: number;
  end: number;
}

export default function ViolationHighlight({
  text,
  violations,
  onViolationClick,
}: ViolationHighlightProps) {
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

  // 겹치는 범위 처리 (나중 것이 우선)
  const mergedRanges = highlightableViolations.filter((item, index) => {
    if (index === 0) return true;
    const prev = highlightableViolations[index - 1];
    // 이전 범위와 겹치면 제외 (나중 것 유지를 위해 역순 처리 필요 시 수정)
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

  // omission 위반 개수 (하이라이트 없는 위반)
  const omissionViolations = violations.filter(v => v.type === 'omission');

  return (
    <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3 pb-2 border-b border-gray-100">
        <h4 className="text-xs sm:text-sm font-medium text-gray-700">위반 하이라이트</h4>
        <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
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
      </div>

      {/* 누락 위반 안내 */}
      {omissionViolations.length > 0 && (
        <div className="mb-2 sm:mb-3 p-2 bg-amber-50 rounded border border-amber-200">
          <p className="text-[10px] sm:text-xs text-amber-700 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>누락 위반 {omissionViolations.length}건</strong> - 필수 고지사항 미포함 (아래 위반 항목에서 확인)
            </span>
          </p>
        </div>
      )}

      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-gray-800 max-h-[200px] sm:max-h-[300px] overflow-y-auto">
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
