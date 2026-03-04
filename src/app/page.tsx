'use client';

import { useState, useCallback } from 'react';
import TextInput from '@/components/TextInput';
import AdTypeSelector from '@/components/AdTypeSelector';
import VerifyButton from '@/components/VerifyButton';
import ResultPanel from '@/components/ResultPanel';
import { AdType } from '@/domain/verification/model';
import { MOCK_SAMPLE_TEXT } from '@/data/mockData';
import { useVerification } from '@/hooks/useVerification';

export default function Home() {
  const [text, setText] = useState('');
  const [adType, setAdType] = useState<AdType>('blog');

  // SSE 기반 검증 훅
  const {
    isLoading,
    result,
    error,
    currentStage,
    completedStages,
    verify,
    reset,
  } = useVerification({ timeout: 120000 }); // 2분 타임아웃

  const handleVerify = useCallback(async () => {
    if (!text.trim()) return;
    await verify(text, adType);
  }, [text, adType, verify]);

  const handleLoadSample = useCallback(() => {
    setText(MOCK_SAMPLE_TEXT);
    reset();
  }, [reset]);

  const handleRetry = useCallback(() => {
    handleVerify();
  }, [handleVerify]);

  const canVerify = text.trim().length > 0 && !isLoading;

  return (
    <main className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#1E40AF] flex items-center justify-center">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">MediChecker</h1>
                <p className="text-[10px] sm:text-xs text-gray-500">의료광고법 AI 준수 검증</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline-flex px-2.5 py-1 text-xs font-medium text-[#1E40AF] bg-blue-50 rounded-full border border-blue-200">
                사전검증 보조 도구
              </span>
              <button
                onClick={handleLoadSample}
                disabled={isLoading}
                className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <span className="hidden sm:inline">샘플 텍스트 불러오기</span>
                <span className="sm:hidden">샘플</span>
              </button>
            </div>
          </div>
        </div>
        <div className="h-0.5 bg-[#1E40AF]" />
      </header>

      {/* 메인 콘텐츠: 모바일 상하 / 데스크탑 좌우 분할 */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full lg:min-h-[calc(100vh-120px)]">
          {/* 입력 패널 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 order-1">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                광고 텍스트 입력
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                검증할 블로그/SNS 광고 텍스트를 입력하세요
              </p>
            </div>

            <AdTypeSelector
              value={adType}
              onChange={setAdType}
              disabled={isLoading}
            />

            <div className="flex-1 min-h-[200px] sm:min-h-0">
              <TextInput
                value={text}
                onChange={setText}
                disabled={isLoading}
              />
            </div>

            <VerifyButton
              onClick={handleVerify}
              disabled={!canVerify}
              loading={isLoading}
            />
          </div>

          {/* 결과 패널 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 order-2 min-h-[400px] lg:min-h-0">
            <ResultPanel
              result={result}
              isLoading={isLoading}
              error={error}
              currentStage={currentStage}
              completedStages={completedStages}
              originalText={text}
              onRetry={handleRetry}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
