/**
 * 통합 테스트: 7단계 파이프라인 전체 플로우
 *
 * 실행: pnpm test tests/pipeline.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { verificationService } from '@/domain/verification/service';
import type { VerifyRequest, VerifyResult, VerifyStage } from '@/domain/verification/model';

// 테스트 케이스 정의
interface TestCase {
  id: string;
  request: VerifyRequest;
  description: string;
  expectedViolation: boolean;
  expectedArticles?: number[]; // 예상 위반 조항
}

const TEST_CASES: TestCase[] = [
  // 위반 케이스
  {
    id: 'TC-001',
    request: {
      text: '보톡스 시술 후 10년은 젊어 보여요! 제 환자분들 후기가 정말 좋습니다.',
      adType: 'blog',
    },
    description: '치료경험담 (2호 위반)',
    expectedViolation: true,
    expectedArticles: [2],
  },
  {
    id: 'TC-002',
    request: {
      text: '필러 시술 100% 만족 보장! 부작용 걱정 없이 안전하게 받으세요.',
      adType: 'instagram',
    },
    description: '거짓 주장 (3호 위반)',
    expectedViolation: true,
    expectedArticles: [3],
  },
  {
    id: 'TC-003',
    request: {
      text: '이번 달 한정! 임플란트 50% 할인 이벤트! 선착순 마감!',
      adType: 'instagram',
    },
    description: '할인 광고 불완전 (13호 위반)',
    expectedViolation: true,
    expectedArticles: [13],
  },
  {
    id: 'TC-004',
    request: {
      text: '쌍꺼풀 수술 전후사진 비교해보세요. 자연스러운 라인을 만들어드립니다.',
      adType: 'blog',
    },
    description: '전후사진 비교 (2호 위반)',
    expectedViolation: true,
    expectedArticles: [2],
  },
  {
    id: 'TC-005',
    request: {
      text: '이 시술로 암이 완치됩니다! 기적의 치료법을 소개합니다.',
      adType: 'youtube',
    },
    description: '허위/과장 (3호, 8호 위반)',
    expectedViolation: true,
    expectedArticles: [3, 8],
  },

  // 적법 케이스
  {
    id: 'TC-006',
    request: {
      text: '피부과 전문의 OOO입니다. 레이저 토닝으로 맑은 피부를 되찾으세요.',
      adType: 'blog',
    },
    description: '적법한 전문의 소개',
    expectedViolation: false,
  },
];

describe('7단계 파이프라인 통합 테스트', () => {
  beforeAll(() => {
    // 환경변수 확인
    expect(process.env.ANTHROPIC_API_KEY).toBeDefined();
    expect(process.env.OPENAI_API_KEY).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });

  describe('파이프라인 스테이지 진행', () => {
    it('7개 스테이지가 순차적으로 실행되어야 한다', async () => {
      const stages: VerifyStage[] = [];

      const result = await verificationService.verify(
        { text: '보톡스 시술 후 10년은 젊어 보입니다', adType: 'blog' },
        (progress) => {
          if (progress.status === 'done') {
            stages.push(progress.stage);
          }
        }
      );

      // 7개 스테이지 완료 확인
      const expectedStages: VerifyStage[] = [
        'keyword_scan',
        'classification',
        'query_rewrite',
        'search',
        'relation_enrichment',
        'judgment',
        'verification',
        'complete',
      ];

      expect(stages).toEqual(expectedStages);
      expect(result).toBeDefined();
      expect(result.metadata.stageTimings).toBeDefined();
    });

    it('메타데이터에 모든 스테이지 타이밍이 포함되어야 한다', async () => {
      const result = await verificationService.verify(
        { text: '필러 시술 50% 할인', adType: 'instagram' }
      );

      const { stageTimings } = result.metadata;
      expect(stageTimings['keyword_scan']).toBeGreaterThanOrEqual(0);
      expect(stageTimings['classification']).toBeGreaterThanOrEqual(0);
      expect(stageTimings['query_rewrite']).toBeGreaterThanOrEqual(0);
      expect(stageTimings['search']).toBeGreaterThanOrEqual(0);
      expect(stageTimings['relation_enrichment']).toBeGreaterThanOrEqual(0);
      expect(stageTimings['judgment']).toBeGreaterThan(0);
      expect(stageTimings['verification']).toBeGreaterThan(0);
    });
  });

  describe('위반 탐지 정확도', () => {
    it.each(TEST_CASES.filter((tc) => tc.expectedViolation))(
      '위반 케이스 $id: $description',
      async (testCase) => {
        const result = await verificationService.verify(testCase.request);

        // 위반 탐지 확인
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.riskScore).toBeGreaterThanOrEqual(50);

        // 예상 조항 포함 확인 (있는 경우)
        if (testCase.expectedArticles) {
          const detectedArticles = result.violations.map((v) => {
            const match = v.article.match(/(\d+)호/);
            return match ? parseInt(match[1]) : 0;
          });

          const hasExpectedArticle = testCase.expectedArticles.some((expected) =>
            detectedArticles.includes(expected)
          );
          expect(hasExpectedArticle).toBe(true);
        }
      },
      120000
    );

    it.each(TEST_CASES.filter((tc) => !tc.expectedViolation))(
      '적법 케이스 $id: $description',
      async (testCase) => {
        const result = await verificationService.verify(testCase.request);

        // 적법 판정 확인 (위반 없거나 낮은 위험도)
        const isLegal = result.violations.length === 0 || result.riskScore < 50;
        expect(isLegal).toBe(true);
      },
      120000
    );
  });

  describe('응답 구조 검증', () => {
    it('VerifyResult 구조가 올바르게 반환되어야 한다', async () => {
      const result = await verificationService.verify({
        text: '임플란트 50% 할인 이벤트',
        adType: 'blog',
      });

      // 최상위 필드 확인
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('metadata');

      // metadata 구조 확인
      expect(result.metadata).toHaveProperty('keywordMatches');
      expect(result.metadata).toHaveProperty('ragChunksUsed');
      expect(result.metadata).toHaveProperty('ontologyChunksUsed');
      expect(result.metadata).toHaveProperty('totalTimeMs');
      expect(result.metadata).toHaveProperty('stageTimings');

      // 타입 확인
      expect(typeof result.riskScore).toBe('number');
      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.violations)).toBe(true);
    });

    it('위반 항목 구조가 올바르게 반환되어야 한다', async () => {
      const result = await verificationService.verify({
        text: '보톡스 시술 100% 효과 보장! 환자 후기 최고!',
        adType: 'instagram',
      });

      if (result.violations.length > 0) {
        const violation = result.violations[0];

        // 필수 필드 확인
        expect(violation).toHaveProperty('type');
        expect(violation).toHaveProperty('text');
        expect(violation).toHaveProperty('article');
        expect(violation).toHaveProperty('description');
        expect(violation).toHaveProperty('confidence');
        expect(violation).toHaveProperty('evidence');
        expect(violation).toHaveProperty('suggestion');

        // type은 expression 또는 omission
        expect(['expression', 'omission']).toContain(violation.type);

        // confidence는 0~100 사이 (퍼센트)
        expect(violation.confidence).toBeGreaterThanOrEqual(0);
        expect(violation.confidence).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('에러 처리', () => {
    it('빈 텍스트도 처리할 수 있어야 한다', async () => {
      const result = await verificationService.verify({
        text: '',
        adType: 'blog',
      });

      expect(result).toBeDefined();
      expect(result.violations).toBeDefined();
    });

    it('긴 텍스트(1500자 이상)도 처리할 수 있어야 한다', async () => {
      const longText = '보톡스 시술을 소개합니다. '.repeat(100);

      const result = await verificationService.verify({
        text: longText,
        adType: 'blog',
      });

      expect(result).toBeDefined();
      expect(result.metadata.totalTimeMs).toBeDefined();
    }, 180000); // 3분 타임아웃
  });

  describe('성능 검증', () => {
    it('일반 광고 검증이 60초 이내에 완료되어야 한다', async () => {
      const startTime = Date.now();

      await verificationService.verify({
        text: '필러 시술 안내. 부기, 멍 등의 부작용이 있을 수 있습니다.',
        adType: 'blog',
      });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(60000);
    });
  });
});

describe('F1-score 측정', () => {
  it('최소 6건 테스트에서 F1 >= 0.80 달성', async () => {
    const results: { expected: boolean; actual: boolean }[] = [];

    for (const testCase of TEST_CASES) {
      const result = await verificationService.verify(testCase.request);
      const hasViolation = result.violations.length > 0;

      results.push({
        expected: testCase.expectedViolation,
        actual: hasViolation,
      });
    }

    // Confusion Matrix
    const tp = results.filter((r) => r.expected && r.actual).length;
    const tn = results.filter((r) => !r.expected && !r.actual).length;
    const fp = results.filter((r) => !r.expected && r.actual).length;
    const fn = results.filter((r) => r.expected && !r.actual).length;

    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = (2 * precision * recall) / (precision + recall) || 0;

    console.log('\n📊 F1-score 측정 결과:');
    console.log(`  TP: ${tp}, TN: ${tn}, FP: ${fp}, FN: ${fn}`);
    console.log(`  Precision: ${(precision * 100).toFixed(1)}%`);
    console.log(`  Recall: ${(recall * 100).toFixed(1)}%`);
    console.log(`  F1-score: ${f1.toFixed(2)}`);

    expect(f1).toBeGreaterThanOrEqual(0.8);
  }, 600000); // 10분 타임아웃
});
