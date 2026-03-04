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
  // 위반 항목들을 위치 기반으로 정렬
  const sortedViolations = [...violations]
    .filter((v) => v.position)
    .sort((a, b) => (a.position![0] - b.position![0]));

  // 텍스트를 세그먼트로 분할
  const segments: TextSegment[] = [];
  let lastEnd = 0;

  sortedViolations.forEach((violation) => {
    const [start, end] = violation.position!;

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
