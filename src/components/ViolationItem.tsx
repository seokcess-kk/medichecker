'use client';

import { useState, useEffect, useRef } from 'react';
import { Violation } from '@/domain/verification/model';
import ExampleFix from './ExampleFix';

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
      text: 'text-[#DC2626]',
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

function getConfidenceBarColor(confidence: number): string {
  if (confidence >= 90) return 'border-l-[#DC2626]';
  if (confidence >= 60) return 'border-l-[#F59E0B]';
  return 'border-l-gray-400';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const badgeStyle = getConfidenceBadgeStyle(violation.confidence);
  const barColor = getConfidenceBarColor(violation.confidence);
  const itemRef = useRef<HTMLDivElement>(null);

  // 선택 시 스크롤
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsExpanded(true);
    }
  }, [isSelected]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      ref={itemRef}
      className={`
        rounded-lg border transition-colors border-l-4
        ${barColor}
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      {/* 헤더 (항상 보임) - 클릭 영역 */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`위반 항목 ${index + 1}: ${violation.text}`}
        className="p-3 sm:p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset rounded-lg"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
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
          {/* 펼침/접힘 아이콘 */}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* 위반 텍스트 */}
        <div className="mt-2 sm:mt-3">
          <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">
            &ldquo;{violation.text}&rdquo;
          </p>
        </div>

        {/* 수정 가이드 (항상 표시, 강조) */}
        <div className="mt-3 p-3 bg-emerald-50 rounded-lg border-l-4 border-[#16A34A]">
          <p className="text-xs font-semibold text-emerald-700 mb-1">수정 가이드</p>
          <p className="text-sm text-emerald-800 break-words">{violation.suggestion}</p>
        </div>

        {/* 수정 예시 (exampleFix가 있을 때만 표시) */}
        {violation.originalText && violation.exampleFix && (
          <ExampleFix
            originalText={violation.originalText}
            exampleFix={violation.exampleFix}
            type={violation.type}
          />
        )}
      </div>

      {/* 펼침 영역 (상세 정보) */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-gray-100 space-y-2 sm:space-y-3 animate-fade-in">
          {/* 조항 */}
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">적용 조항</p>
            <p className="text-xs sm:text-sm font-medium text-gray-800">{violation.article}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 break-words">
              {violation.description}
            </p>
          </div>

          {/* 근거 */}
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">판단 근거</p>
            <p className="text-xs sm:text-sm text-gray-700 break-words">{violation.evidence}</p>
          </div>

          {/* 검토 노트 */}
          {violation.reviewNote && (
            <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-[10px] sm:text-xs text-yellow-700 break-words">
                <span className="font-medium">검토 필요:</span> {violation.reviewNote}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
