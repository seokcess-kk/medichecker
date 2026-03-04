'use client';

import { Violation } from '@/domain/verification/model';

interface ViolationItemProps {
  violation: Violation;
  index: number;
  isSelected?: boolean;
  onClick?: () => void;
}

function getConfidenceBadgeStyle(confidence: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (confidence >= 90) {
    return {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
    };
  }
  if (confidence >= 60) {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
    };
  }
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
  };
}

function getTypeLabel(type: 'expression' | 'omission'): string {
  return type === 'expression' ? '표현 위반' : '누락 위반';
}

export default function ViolationItem({
  violation,
  index,
  isSelected = false,
  onClick,
}: ViolationItemProps) {
  const badgeStyle = getConfidenceBadgeStyle(violation.confidence);

  return (
    <div
      onClick={onClick}
      className={`
        p-3 sm:p-4 rounded-lg border transition-all cursor-pointer
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      {/* 헤더 */}
      <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
        <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-100 text-[10px] sm:text-xs font-medium text-gray-600">
          {index + 1}
        </span>
        <span
          className={`
            px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium
            ${badgeStyle.bg} ${badgeStyle.text} border ${badgeStyle.border}
          `}
        >
          {violation.confidence}%
        </span>
        <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs bg-gray-100 text-gray-600">
          {getTypeLabel(violation.type)}
        </span>
      </div>

      {/* 위반 텍스트 */}
      <div className="mb-2 sm:mb-3">
        <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">
          &ldquo;{violation.text}&rdquo;
        </p>
      </div>

      {/* 조항 */}
      <div className="mb-2 sm:mb-3 p-2 bg-gray-50 rounded">
        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">적용 조항</p>
        <p className="text-xs sm:text-sm font-medium text-gray-800">{violation.article}</p>
        <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 break-words">
          {violation.description}
        </p>
      </div>

      {/* 근거 */}
      <div className="mb-2 sm:mb-3">
        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">판단 근거</p>
        <p className="text-xs sm:text-sm text-gray-700 break-words">{violation.evidence}</p>
        {violation.relationPath && (
          <p className="text-[10px] sm:text-xs text-blue-600 mt-1 font-mono break-all">
            {violation.relationPath}
          </p>
        )}
      </div>

      {/* 수정 가이드 */}
      <div className="p-2 sm:p-3 bg-green-50 rounded border border-green-200">
        <p className="text-[10px] sm:text-xs text-green-600 font-medium mb-0.5 sm:mb-1">
          수정 가이드
        </p>
        <p className="text-xs sm:text-sm text-green-800 break-words">{violation.suggestion}</p>
      </div>

      {/* 검토 노트 */}
      {violation.reviewNote && (
        <div className="mt-2 sm:mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-[10px] sm:text-xs text-yellow-700 break-words">
            <span className="font-medium">검토 필요:</span> {violation.reviewNote}
          </p>
        </div>
      )}
    </div>
  );
}
