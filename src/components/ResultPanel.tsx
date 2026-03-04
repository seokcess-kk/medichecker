'use client';

import { useState } from 'react';
import { VerifyResult, VerifyStage, Violation } from '@/domain/verification/model';
import RiskScore from './RiskScore';
import ViolationHighlight from './ViolationHighlight';
import ViolationItem from './ViolationItem';
import ProgressIndicator from './ProgressIndicator';

interface ResultPanelProps {
  result: VerifyResult | null;
  isLoading: boolean;
  error?: string | null;
  currentStage: VerifyStage | null;
  completedStages: VerifyStage[];
  originalText: string;
  onRetry?: () => void;
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center py-8 sm:py-12">
      <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <svg
          className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
        광고 텍스트를 검증하세요
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
        의료광고법 제56조 기준으로 위반 여부를 AI가 자동 분석합니다
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-md px-4">
        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
            <span className="text-green-600 text-sm font-bold">1</span>
          </div>
          <span className="text-xs text-gray-600 text-center">텍스트 입력</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <span className="text-blue-600 text-sm font-bold">2</span>
          </div>
          <span className="text-xs text-gray-600 text-center">AI 분석</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mb-2">
            <span className="text-purple-600 text-sm font-bold">3</span>
          </div>
          <span className="text-xs text-gray-600 text-center">결과 확인</span>
        </div>
      </div>
    </div>
  );
}

function LoadingState({
  currentStage,
  completedStages,
}: {
  currentStage: VerifyStage | null;
  completedStages: VerifyStage[];
}) {
  return (
    <div className="h-full flex flex-col">
      <ProgressIndicator
        currentStage={currentStage}
        completedStages={completedStages}
      />
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="text-center">
          {/* 펄스 애니메이션 로딩 */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-25" />
            <div className="absolute inset-2 rounded-full bg-blue-50 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
            AI가 광고를 분석 중입니다
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 animate-pulse">
            잠시만 기다려주세요...
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center py-8 sm:py-12">
      <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-full bg-red-50 flex items-center justify-center">
        <svg
          className="w-10 h-10 sm:w-12 sm:h-12 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
        검증 중 오류가 발생했습니다
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          다시 시도
        </button>
      )}
    </div>
  );
}

export default function ResultPanel({
  result,
  isLoading,
  error,
  currentStage,
  completedStages,
  originalText,
  onRetry,
}: ResultPanelProps) {
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(
    null
  );

  // 에러 상태
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <LoadingState
        currentStage={currentStage}
        completedStages={completedStages}
      />
    );
  }

  // 빈 상태 (검증 전)
  if (!result) {
    return <EmptyState />;
  }

  // 결과 표시
  return (
    <div className="h-full flex flex-col gap-3 sm:gap-4 overflow-hidden">
      {/* 완료 상태 표시 (컴팩트 모드) */}
      <ProgressIndicator
        currentStage={null}
        completedStages={[
          'keyword_scan',
          'classification',
          'query_rewrite',
          'search',
          'relation_enrichment',
          'judgment',
          'verification',
        ]}
        isComplete={true}
        totalTimeMs={result.metadata.totalTimeMs}
      />

      {/* 위험도 점수 + 요약 (스크롤 영역 밖, 최상단 고정) */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <RiskScore score={result.riskScore} />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
              검증 결과 요약
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {result.summary}
            </p>
          </div>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1 sm:pr-2">
        {/* 위반 하이라이트 */}
        <ViolationHighlight
          text={originalText}
          violations={result.violations}
          onViolationClick={setSelectedViolation}
        />

        {/* 위반 항목 목록 */}
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            위반 의심 항목 ({result.violations.length}건)
          </h3>
          {result.violations.length === 0 ? (
            <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-[#16A34A]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-[#16A34A] font-medium">
                위반 의심 항목이 발견되지 않았습니다
              </p>
              <p className="text-green-600 text-sm mt-1">
                최종 확인은 전문가 검토를 권장합니다
              </p>
            </div>
          ) : (
            result.violations.map((violation, index) => (
              <ViolationItem
                key={index}
                violation={violation}
                index={index}
                isSelected={selectedViolation === violation}
                onClick={() => setSelectedViolation(violation)}
              />
            ))
          )}
        </div>
      </div>

      {/* 면책 조항 */}
      <div className="pt-2 sm:pt-3 border-t border-gray-200 flex-shrink-0">
        <p className="text-[10px] sm:text-xs text-gray-400 text-center">
          MediChecker는 AI 기반 사전검증 보조 도구이며, 법률 자문을 대체하지
          않습니다. 최종 판단은 의료법 전문가의 검토를 받으시기 바랍니다.
        </p>
      </div>
    </div>
  );
}
