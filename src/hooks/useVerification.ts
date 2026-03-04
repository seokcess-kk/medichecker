/**
 * useVerification Hook
 * SSE 기반 /api/verify 호출 및 실시간 상태 관리
 */

import { useState, useCallback, useRef } from 'react';
import type {
  VerifyResult,
  VerifyStage,
  VerifyProgress,
  AdType,
} from '@/domain/verification/model';

interface UseVerificationOptions {
  timeout?: number; // 전체 타임아웃 (ms)
}

interface UseVerificationReturn {
  isLoading: boolean;
  result: VerifyResult | null;
  error: string | null;
  currentStage: VerifyStage | null;
  completedStages: VerifyStage[];
  verify: (text: string, adType: AdType) => Promise<void>;
  reset: () => void;
  abort: () => void;
}

const DEFAULT_TIMEOUT = 120000; // 2분

export function useVerification(
  options: UseVerificationOptions = {}
): UseVerificationReturn {
  const { timeout = DEFAULT_TIMEOUT } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<VerifyStage | null>(null);
  const [completedStages, setCompletedStages] = useState<VerifyStage[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setResult(null);
    setError(null);
    setCurrentStage(null);
    setCompletedStages([]);
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const verify = useCallback(
    async (text: string, adType: AdType) => {
      // 이전 요청 취소
      abort();

      // 상태 초기화
      setIsLoading(true);
      setResult(null);
      setError(null);
      setCurrentStage(null);
      setCompletedStages([]);

      // AbortController 생성
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      // 타임아웃 설정
      timeoutIdRef.current = setTimeout(() => {
        setError('검증 시간이 초과되었습니다. 다시 시도해주세요.');
        abort();
      }, timeout);

      try {
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, adType }),
          signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status} 오류`);
        }

        if (!response.body) {
          throw new Error('응답 스트림이 없습니다.');
        }

        // SSE 스트림 읽기
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE 이벤트 파싱
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // 불완전한 마지막 라인 보관

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              // 진행 상태 이벤트
              if ('stage' in data && 'status' in data) {
                const progress = data as VerifyProgress;

                if (progress.status === 'running') {
                  setCurrentStage(progress.stage);
                } else if (progress.status === 'done') {
                  setCompletedStages((prev) =>
                    prev.includes(progress.stage)
                      ? prev
                      : [...prev, progress.stage]
                  );
                }
              }

              // 최종 결과 이벤트
              if (data.type === 'result') {
                if (data.data.error) {
                  throw new Error(data.data.error);
                }
                setResult(data.data as VerifyResult);
                setCurrentStage(null);
              }
            } catch (parseError) {
              console.warn('SSE 파싱 오류:', parseError);
            }
          }
        }

        // 타임아웃 해제
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            // 사용자가 취소한 경우
            if (!error) {
              setError('요청이 취소되었습니다.');
            }
          } else {
            setError(err.message || '검증 중 오류가 발생했습니다.');
          }
        } else {
          setError('알 수 없는 오류가 발생했습니다.');
        }
        setCurrentStage(null);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      }
    },
    [abort, timeout, error]
  );

  return {
    isLoading,
    result,
    error,
    currentStage,
    completedStages,
    verify,
    reset,
    abort,
  };
}
