/**
 * 전체 파이프라인 테스트 스크립트 (10건 샘플)
 *
 * 실행: pnpm tsx scripts/test-full-pipeline.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { verificationService } from '../src/domain/verification/service';
import type { VerifyRequest, VerifyProgress } from '../src/domain/verification/model';

// 테스트용 샘플 광고 (10건)
const SAMPLE_ADS: Array<{
  id: string;
  text: string;
  adType: VerifyRequest['adType'];
  description: string;
  expectedViolation: boolean;
}> = [
  {
    id: 'AD-001',
    text: '보톡스 시술 후 10년은 젊어 보여요! 제 환자분들 후기가 정말 좋습니다.',
    adType: 'blog',
    description: '치료경험담 (2호)',
    expectedViolation: true,
  },
  {
    id: 'AD-002',
    text: '필러 시술 100% 만족 보장! 부작용 걱정 없이 안전하게 받으세요.',
    adType: 'instagram',
    description: '100% 보장 과장광고 (3호)',
    expectedViolation: true,
  },
  {
    id: 'AD-003',
    text: '보톡스 전문의가 직접 시술합니다. (의료법상 자격 표시 가능)',
    adType: 'blog',
    description: '적법한 자격 표시',
    expectedViolation: false,
  },
  {
    id: 'AD-004',
    text: '이번 달 한정! 임플란트 50% 할인 이벤트! 선착순 마감!',
    adType: 'instagram',
    description: '할인 광고 (13호)',
    expectedViolation: true,
  },
  {
    id: 'AD-005',
    text: '쌍꺼풀 수술 전후사진 비교해보세요. 자연스러운 라인을 만들어드립니다.',
    adType: 'blog',
    description: '수술전후 사진 (2호)',
    expectedViolation: true,
  },
  {
    id: 'AD-006',
    text: '피부과 전문의 OOO입니다. 레이저 토닝으로 맑은 피부를 되찾으세요.',
    adType: 'blog',
    description: '적법한 의료광고',
    expectedViolation: false,
  },
  {
    id: 'AD-007',
    text: '이 시술로 암이 완치됩니다! 기적의 치료법을 소개합니다.',
    adType: 'youtube',
    description: '과장/허위 광고 (3호, 8호)',
    expectedViolation: true,
  },
  {
    id: 'AD-008',
    text: '눈밑지방재배치 수술. 부기, 멍, 출혈 등의 부작용이 있을 수 있습니다.',
    adType: 'blog',
    description: '부작용 고지 포함 (적법)',
    expectedViolation: false,
  },
  {
    id: 'AD-009',
    text: '보톡스 마스터 자격증 보유! 국제 인정 전문가가 시술합니다.',
    adType: 'instagram',
    description: '무자격 표방 (9호) - "보톡스 마스터"는 공인 자격 아님',
    expectedViolation: true,
  },
  {
    id: 'AD-010',
    text: '라식 수술 후 다음날부터 일상 복귀 가능. 무통증 시술.',
    adType: 'blog',
    description: '과장 표현 가능성 (다음날 일상 복귀, 무통증)',
    expectedViolation: true,
  },
];

async function testFullPipeline() {
  console.log('🔬 전체 파이프라인 테스트 (10건 샘플)\n');
  console.log('═'.repeat(80));

  const results: Array<{
    id: string;
    description: string;
    expected: boolean;
    actual: boolean;
    violations: number;
    riskScore: number;
    timeMs: number;
    correct: boolean;
  }> = [];

  for (const sample of SAMPLE_ADS) {
    console.log(`\n📌 ${sample.id}: ${sample.description}`);
    console.log(`   광고: "${sample.text.slice(0, 50)}..."`);

    const request: VerifyRequest = {
      text: sample.text,
      adType: sample.adType,
    };

    const startTime = Date.now();

    // 진행 상태 출력
    const onProgress = (progress: VerifyProgress) => {
      const status = progress.status === 'running' ? '⏳' : '✅';
      process.stdout.write(`\r   ${status} ${progress.stage}...`);
    };

    try {
      const result = await verificationService.verify(request, onProgress);
      const elapsed = Date.now() - startTime;

      const hasViolation = result.violations.length > 0;
      const isCorrect = hasViolation === sample.expectedViolation;

      console.log(`\n   결과: ${hasViolation ? '⚠️ 위반' : '✅ 적법'} | 위험도: ${result.riskScore}점`);
      console.log(`   위반 ${result.violations.length}건 | 소요시간: ${elapsed}ms`);
      console.log(`   예측: ${isCorrect ? '✅ 정확' : '❌ 오류'} (예상: ${sample.expectedViolation ? '위반' : '적법'})`);

      if (result.violations.length > 0) {
        console.log('   위반 상세:');
        for (const v of result.violations.slice(0, 2)) {
          console.log(`     - [${v.type}] ${v.article}: ${v.description.slice(0, 40)}...`);
        }
      }

      results.push({
        id: sample.id,
        description: sample.description,
        expected: sample.expectedViolation,
        actual: hasViolation,
        violations: result.violations.length,
        riskScore: result.riskScore,
        timeMs: elapsed,
        correct: isCorrect,
      });
    } catch (error) {
      console.log(`\n   ❌ 에러: ${error instanceof Error ? error.message : String(error)}`);
      results.push({
        id: sample.id,
        description: sample.description,
        expected: sample.expectedViolation,
        actual: false,
        violations: 0,
        riskScore: 0,
        timeMs: Date.now() - startTime,
        correct: false,
      });
    }
  }

  // 결과 요약
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 테스트 결과 요약:\n');

  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const accuracy = ((correct / total) * 100).toFixed(1);

  console.log(`정확도: ${correct}/${total} (${accuracy}%)`);

  // TP, TN, FP, FN 계산
  const tp = results.filter((r) => r.expected && r.actual).length;
  const tn = results.filter((r) => !r.expected && !r.actual).length;
  const fp = results.filter((r) => !r.expected && r.actual).length;
  const fn = results.filter((r) => r.expected && !r.actual).length;

  console.log(`\nConfusion Matrix:`);
  console.log(`  TP (정탐): ${tp}  FN (미탐): ${fn}`);
  console.log(`  FP (오탐): ${fp}  TN (정확): ${tn}`);

  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = (2 * precision * recall) / (precision + recall) || 0;

  console.log(`\nPrecision: ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall: ${(recall * 100).toFixed(1)}%`);
  console.log(`F1-score: ${(f1).toFixed(2)}`);

  const avgTime = results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;
  console.log(`\n평균 응답시간: ${avgTime.toFixed(0)}ms`);

  // 실패 케이스 분석
  const failures = results.filter((r) => !r.correct);
  if (failures.length > 0) {
    console.log('\n❌ 오류 케이스:');
    for (const f of failures) {
      console.log(`  - ${f.id}: ${f.description} (예상: ${f.expected ? '위반' : '적법'}, 실제: ${f.actual ? '위반' : '적법'})`);
    }
  }

  console.log('\n🎉 테스트 완료!');
}

testFullPipeline().catch(console.error);
