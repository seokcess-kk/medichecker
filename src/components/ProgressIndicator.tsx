'use client';

import { useState } from 'react';
import { VerifyStage, STAGE_LABELS } from '@/domain/verification/model';
import { STAGES_ORDER } from '@/data/mockData';

interface ProgressIndicatorProps {
  currentStage: VerifyStage | null;
  completedStages: VerifyStage[];
  isComplete?: boolean;
  totalTimeMs?: number;
}

export default function ProgressIndicator({
  currentStage,
  completedStages,
  isComplete = false,
  totalTimeMs,
}: ProgressIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStageStatus = (stage: VerifyStage) => {
    if (completedStages.includes(stage)) return 'done';
    if (stage === currentStage) return 'running';
    return 'pending';
  };

  const completedCount = completedStages.length;
  const totalCount = STAGES_ORDER.length;
  const progressPercent = (completedCount / totalCount) * 100;

  // 완료 상태에서 컴팩트 뷰 (접힌 상태)
  if (isComplete && !isExpanded) {
    return (
      <div className="w-full py-2">
        <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-green-700">
              7단계 검증 완료
              {totalTimeMs && <span className="tabular-nums"> ({(totalTimeMs / 1000).toFixed(1)}초)</span>}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            aria-expanded="false"
            aria-label="검증 단계 상세 보기"
            className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 rounded"
          >
            상세 보기
            <svg
              className="w-3 h-3"
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
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-2 sm:py-4">
      {/* 완료 상태에서 접기 버튼 */}
      {isComplete && isExpanded && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setIsExpanded(false)}
            aria-expanded="true"
            aria-label="검증 단계 접기"
            className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 rounded"
          >
            접기
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* 모바일: 간소화된 진행바 */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">
            {currentStage ? STAGE_LABELS[currentStage] : '검증 완료'}
          </span>
          <span className="text-xs text-gray-500 tabular-nums">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              completedCount === totalCount ? 'bg-[#16A34A]' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {currentStage && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
            <span className="text-xs text-blue-600 animate-pulse">처리 중…</span>
          </div>
        )}
      </div>

      {/* 데스크탑: 단계별 상세 표시 */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between gap-1">
          {STAGES_ORDER.map((stage, index) => {
            const status = getStageStatus(stage);
            const isLast = index === STAGES_ORDER.length - 1;

            return (
              <div key={stage} className="flex items-center flex-1">
                {/* 단계 표시 */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`
                      w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center
                      text-xs font-medium transition-colors duration-300
                      ${
                        status === 'done'
                          ? 'bg-[#16A34A] text-white'
                          : status === 'running'
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-400'
                      }
                    `}
                    aria-label={`${STAGE_LABELS[stage]}: ${status === 'done' ? '완료' : status === 'running' ? '진행 중' : '대기'}`}
                  >
                    {status === 'done' ? (
                      <svg
                        className="w-3.5 h-3.5 lg:w-4 lg:h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : status === 'running' ? (
                      <svg
                        className="w-3.5 h-3.5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`
                      text-[9px] lg:text-[10px] text-center whitespace-nowrap
                      transition-colors duration-300
                      ${
                        status === 'done'
                          ? 'text-[#16A34A]'
                          : status === 'running'
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {STAGE_LABELS[stage]}
                  </span>
                </div>

                {/* 연결선 */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-0.5 lg:mx-1 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-200" />
                    <div
                      className={`
                        absolute inset-y-0 left-0 bg-[#16A34A] transition-all duration-500
                        ${status === 'done' ? 'w-full' : 'w-0'}
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
