/**
 * 정확도 평가 스크립트 (60건 테스트 데이터셋)
 *
 * 실행: pnpm tsx scripts/eval/run-eval.ts
 *
 * 기능:
 * 1. 60건 전체 평가 → F1-score 측정
 * 2. 온톨로지 A/B 비교 (useOntology true/false)
 * 3. 상세 리포트 출력
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { verificationService } from '../../src/domain/verification/service';
import type { VerifyRequest } from '../../src/domain/verification/model';
import * as fs from 'fs';
import * as path from 'path';

// 테스트 데이터셋 타입
interface TestCase {
  id: string;
  category: string;
  text: string;
  adType: 'blog' | 'instagram' | 'youtube' | 'other';
  expectedViolations: Array<{
    article: string;
    type: string;
    confidence: string;
  }>;
  isViolation: boolean;
  labelConfidence: 'high' | 'medium' | 'low';
  labelSource: string;
  notes: string;
}

interface EvalResult {
  id: string;
  expected: boolean;
  actual: boolean;
  correct: boolean;
  violations: number;
  riskScore: number;
  timeMs: number;
  labelConfidence: string;
  category: string;
}

interface EvalMetrics {
  total: number;
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  avgTimeMs: number;
}

// 데이터셋 로드
function loadTestDataset(): TestCase[] {
  const datasetPath = path.join(__dirname, 'test-dataset.json');
  const data = fs.readFileSync(datasetPath, 'utf-8');
  return JSON.parse(data) as TestCase[];
}

// 메트릭 계산
function calculateMetrics(results: EvalResult[]): EvalMetrics {
  const tp = results.filter((r) => r.expected && r.actual).length;
  const tn = results.filter((r) => !r.expected && !r.actual).length;
  const fp = results.filter((r) => !r.expected && r.actual).length;
  const fn = results.filter((r) => r.expected && !r.actual).length;

  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = (2 * precision * recall) / (precision + recall) || 0;
  const accuracy = (tp + tn) / results.length || 0;
  const avgTimeMs = results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;

  return {
    total: results.length,
    tp,
    tn,
    fp,
    fn,
    precision,
    recall,
    f1,
    accuracy,
    avgTimeMs,
  };
}

// 단일 테스트 케이스 실행
async function runTestCase(
  testCase: TestCase,
  useOntology: boolean,
  index: number,
  total: number
): Promise<EvalResult> {
  const request: VerifyRequest = {
    text: testCase.text,
    adType: testCase.adType,
  };

  const startTime = Date.now();

  try {
    const result = await verificationService.verify(request, undefined, { useOntology });
    const elapsed = Date.now() - startTime;

    const hasViolation = result.violations.length > 0;
    const isCorrect = hasViolation === testCase.isViolation;

    // 진행 상태 출력
    const status = isCorrect ? '✅' : '❌';
    const violationStatus = hasViolation ? '위반' : '적법';
    process.stdout.write(
      `\r[${index + 1}/${total}] ${testCase.id}: ${status} (${violationStatus}, ${elapsed}ms)    `
    );

    return {
      id: testCase.id,
      expected: testCase.isViolation,
      actual: hasViolation,
      correct: isCorrect,
      violations: result.violations.length,
      riskScore: result.riskScore,
      timeMs: elapsed,
      labelConfidence: testCase.labelConfidence,
      category: testCase.category,
    };
  } catch (error) {
    console.error(`\n❌ ${testCase.id} 에러:`, error);
    return {
      id: testCase.id,
      expected: testCase.isViolation,
      actual: false,
      correct: false,
      violations: 0,
      riskScore: 0,
      timeMs: Date.now() - startTime,
      labelConfidence: testCase.labelConfidence,
      category: testCase.category,
    };
  }
}

// 전체 평가 실행
async function runEvaluation(
  testCases: TestCase[],
  useOntology: boolean,
  label: string
): Promise<{ results: EvalResult[]; metrics: EvalMetrics }> {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 ${label} (${testCases.length}건)`);
  console.log('═'.repeat(60));

  const results: EvalResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const result = await runTestCase(testCases[i], useOntology, i, testCases.length);
    results.push(result);

    // Rate limit 방지
    await sleep(100);
  }

  console.log('\n');

  const metrics = calculateMetrics(results);
  return { results, metrics };
}

// 리포트 출력
function printReport(
  withOntology: { results: EvalResult[]; metrics: EvalMetrics },
  withoutOntology: { results: EvalResult[]; metrics: EvalMetrics } | null
) {
  console.log('\n' + '═'.repeat(60));
  console.log('📈 평가 결과 리포트');
  console.log('═'.repeat(60));

  // 메인 메트릭 (온톨로지 활성화)
  const m = withOntology.metrics;
  console.log('\n## 파이프라인 정확도 (온톨로지 활성화)');
  console.log('─'.repeat(40));
  console.log(`| 지표       | 결과   | 기준   | 상태 |`);
  console.log(`|------------|--------|--------|------|`);
  console.log(
    `| Precision  | ${(m.precision * 100).toFixed(1)}%  | ≥85%   | ${m.precision >= 0.85 ? '✅' : '❌'} |`
  );
  console.log(
    `| Recall     | ${(m.recall * 100).toFixed(1)}%  | ≥90%   | ${m.recall >= 0.9 ? '✅' : '❌'} |`
  );
  console.log(
    `| F1-score   | ${m.f1.toFixed(3)}  | ≥0.85  | ${m.f1 >= 0.85 ? '✅' : '❌'} |`
  );
  console.log(`| Accuracy   | ${(m.accuracy * 100).toFixed(1)}%  | -      | -  |`);

  console.log('\n## Confusion Matrix');
  console.log('─'.repeat(40));
  console.log(`  TP (정탐): ${m.tp}  FN (미탐): ${m.fn}`);
  console.log(`  FP (오탐): ${m.fp}  TN (정확): ${m.tn}`);

  console.log(`\n평균 응답시간: ${m.avgTimeMs.toFixed(0)}ms`);

  // 온톨로지 A/B 비교
  if (withoutOntology) {
    const mWithout = withoutOntology.metrics;
    const contribution = m.f1 - mWithout.f1;

    console.log('\n## 온톨로지 A/B 비교');
    console.log('─'.repeat(40));
    console.log(`| 조건              | F1-score | Precision | Recall |`);
    console.log(`|-------------------|----------|-----------|--------|`);
    console.log(
      `| Without Ontology  | ${mWithout.f1.toFixed(3)}    | ${(mWithout.precision * 100).toFixed(1)}%      | ${(mWithout.recall * 100).toFixed(1)}%   |`
    );
    console.log(
      `| With Ontology     | ${m.f1.toFixed(3)}    | ${(m.precision * 100).toFixed(1)}%      | ${(m.recall * 100).toFixed(1)}%   |`
    );
    console.log(`| **기여율**        | **${contribution >= 0 ? '+' : ''}${(contribution * 100).toFixed(1)}%** |           |        |`);

    if (contribution >= 0.03) {
      console.log('\n✅ 온톨로지 기여율 ≥ 3% → Phase 2 진행 가치 있음');
    } else if (contribution > 0) {
      console.log('\n⚠️  온톨로지 기여율 < 3% → 다른 개선 방향 우선 고려');
    } else {
      console.log('\n❌ 온톨로지 기여율 음수 → 온톨로지 로직 점검 필요');
    }
  }

  // 실패 케이스 분석
  const failures = withOntology.results.filter((r) => !r.correct);
  if (failures.length > 0) {
    console.log('\n## 실패 케이스 분석');
    console.log('─'.repeat(40));

    const fpCases = failures.filter((r) => !r.expected && r.actual);
    const fnCases = failures.filter((r) => r.expected && !r.actual);

    if (fpCases.length > 0) {
      console.log(`\n### 오탐 (FP): ${fpCases.length}건`);
      for (const c of fpCases.slice(0, 5)) {
        console.log(`  - ${c.id} [${c.category}] (신뢰도: ${c.labelConfidence})`);
      }
    }

    if (fnCases.length > 0) {
      console.log(`\n### 미탐 (FN): ${fnCases.length}건`);
      for (const c of fnCases.slice(0, 5)) {
        console.log(`  - ${c.id} [${c.category}] (신뢰도: ${c.labelConfidence})`);
      }
    }
  }

  // 카테고리별 정확도
  console.log('\n## 카테고리별 정확도');
  console.log('─'.repeat(40));
  const categories = [...new Set(withOntology.results.map((r) => r.category))];
  for (const cat of categories) {
    const catResults = withOntology.results.filter((r) => r.category === cat);
    const catCorrect = catResults.filter((r) => r.correct).length;
    const catAcc = (catCorrect / catResults.length) * 100;
    console.log(`  ${cat}: ${catCorrect}/${catResults.length} (${catAcc.toFixed(1)}%)`);
  }

  return m.f1;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 메인 실행
async function main() {
  console.log('🔬 MediChecker 정확도 평가 (60건 테스트 데이터셋)\n');

  // 데이터셋 로드
  const testCases = loadTestDataset();
  console.log(`📁 테스트 데이터셋: ${testCases.length}건 로드됨`);

  // 카테고리별 분포 출력
  const categories: Record<string, number> = {};
  testCases.forEach((tc) => {
    categories[tc.category] = (categories[tc.category] || 0) + 1;
  });
  console.log('카테고리 분포:');
  Object.entries(categories).forEach(([k, v]) => console.log(`  - ${k}: ${v}건`));

  // A/B 테스트 여부 확인 (환경변수로 제어 가능)
  const runABTest = process.env.SKIP_AB_TEST !== 'true';

  // 온톨로지 활성화 평가
  const withOntology = await runEvaluation(testCases, true, '온톨로지 활성화 평가');

  // 온톨로지 비활성화 평가 (A/B 테스트)
  let withoutOntology: { results: EvalResult[]; metrics: EvalMetrics } | null = null;
  if (runABTest) {
    withoutOntology = await runEvaluation(testCases, false, '온톨로지 비활성화 평가 (A/B)');
  }

  // 리포트 출력
  const f1 = printReport(withOntology, withoutOntology);

  // 결과 저장
  const reportPath = path.join(__dirname, 'eval-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    testCases: testCases.length,
    withOntology: {
      metrics: withOntology.metrics,
      failures: withOntology.results.filter((r) => !r.correct).map((r) => r.id),
    },
    withoutOntology: withoutOntology
      ? {
          metrics: withoutOntology.metrics,
          failures: withoutOntology.results.filter((r) => !r.correct).map((r) => r.id),
        }
      : null,
    ontologyContribution: withoutOntology
      ? withOntology.metrics.f1 - withoutOntology.metrics.f1
      : null,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 결과 저장: ${reportPath}`);

  // F1 기준 판정
  console.log('\n' + '═'.repeat(60));
  if (f1 >= 0.85) {
    console.log('🎉 F1 ≥ 0.85 달성! 평가 통과!');
  } else {
    console.log(`⚠️  F1 = ${f1.toFixed(3)} < 0.85 - 프롬프트 튜닝 필요`);
  }
  console.log('═'.repeat(60));

  return f1;
}

main().catch(console.error);
