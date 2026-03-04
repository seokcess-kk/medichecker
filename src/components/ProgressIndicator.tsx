'use client';

import { VerifyStage, STAGE_LABELS } from '@/domain/verification/model';
import { STAGES_ORDER } from '@/data/mockData';

interface ProgressIndicatorProps {
  currentStage: VerifyStage | null;
  completedStages: VerifyStage[];
}

export default function ProgressIndicator({
  currentStage,
  completedStages,
}: ProgressIndicatorProps) {
  const getStageStatus = (stage: VerifyStage) => {
    if (completedStages.includes(stage)) return 'done';
    if (stage === currentStage) return 'running';
    return 'pending';
  };

  const completedCount = completedStages.length;
  const totalCount = STAGES_ORDER.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="w-full py-2 sm:py-4">
      {/* 모바일: 간소화된 진행바 */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">
            {currentStage ? STAGE_LABELS[currentStage] : '검증 완료'}
          </span>
          <span className="text-xs text-gray-500">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              completedCount === totalCount ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {currentStage && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-blue-600 animate-pulse">처리 중...</span>
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
                      text-xs font-medium transition-all duration-300
                      ${
                        status === 'done'
                          ? 'bg-green-500 text-white scale-100'
                          : status === 'running'
                          ? 'bg-blue-500 text-white animate-pulse scale-110'
                          : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {status === 'done' ? (
                      <svg
                        className="w-3.5 h-3.5 lg:w-4 lg:h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
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
                          ? 'text-green-600'
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
                        absolute inset-y-0 left-0 bg-green-500 transition-all duration-500
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
