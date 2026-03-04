/**
 * B5 테스트 스크립트: 2~3단계 AI 분류 + 쿼리 변환 검증
 *
 * 실행: pnpm tsx scripts/test-classification.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { classifyContext, rewriteQuery } from '../src/lib/claude';

// 테스트용 샘플 광고 텍스트 5건
const sampleAds = [
  {
    id: 1,
    text: `저희 병원에서 보톡스 시술 받으신 고객님들의 후기입니다!
"시술 전에는 이마 주름이 너무 깊었는데, 시술 후 완전히 사라졌어요! 정말 강추합니다!"
보톡스 시술, 간단하고 안전한 10분 시술로 10년 젊어지세요.
지금 예약하시면 50% 할인!`,
    adType: 'blog',
    expected: {
      specialty: '성형외과 또는 피부과',
      procedure: '보톡스',
      claims: ['환자 후기', '전후 비교', '효과 과장', '할인'],
    },
  },
  {
    id: 2,
    text: `★ 임플란트 평생 무료 AS ★
국내 최고의 임플란트 전문 치과!
임플란트 1개 99만원 (정가 200만원)
개원 3개월 만에 500건 시술 달성!
지금 바로 예약하세요!`,
    adType: 'instagram',
    expected: {
      specialty: '치과',
      procedure: '임플란트',
      claims: ['최고', '할인', '6개월 이하 경력'],
    },
  },
  {
    id: 3,
    text: `라식 수술 100% 성공률!
부작용 걱정 없이 안전하게!
수술 후 다음날부터 일상생활 가능
시력 1.0 이상 보장!
전후 사진으로 놀라운 변화를 확인하세요.`,
    adType: 'homepage',
    expected: {
      specialty: '안과',
      procedure: '라식',
      claims: ['100% 성공', '부작용 없음', '전후사진'],
    },
  },
  {
    id: 4,
    text: `한방 다이어트로 3개월 만에 20kg 감량!
요요 없는 건강한 다이어트!
수많은 환자분들이 효과를 경험하셨습니다.
기적 같은 변화를 만나보세요.`,
    adType: 'blog',
    expected: {
      specialty: '한의원',
      procedure: '한방다이어트',
      claims: ['환자 경험담', '효과 과장', '기적'],
    },
  },
  {
    id: 5,
    text: `성형외과 전문의 홍길동 원장
2024 대한민국 베스트 성형외과 선정!
쌍꺼풀 수술 전문
자연스러운 눈매 교정
상담 예약: 02-1234-5678`,
    adType: 'instagram',
    expected: {
      specialty: '성형외과',
      procedure: '쌍꺼풀',
      claims: ['비공인 인증'],
    },
  },
];

async function testClassification() {
  console.log('='.repeat(60));
  console.log('B5 테스트: 2~3단계 AI 분류 + 쿼리 변환');
  console.log('='.repeat(60));
  console.log('');

  for (const sample of sampleAds) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📌 샘플 ${sample.id} (${sample.adType})`);
    console.log(`${'─'.repeat(60)}`);
    console.log('📝 광고 텍스트:');
    console.log(sample.text.slice(0, 100) + (sample.text.length > 100 ? '...' : ''));
    console.log('');

    try {
      // 2단계: 컨텍스트 분류
      console.log('🔍 2단계: 컨텍스트 분류 (Claude Haiku)...');
      const startClassify = Date.now();
      const classification = await classifyContext(sample.text, sample.adType);
      const classifyTime = Date.now() - startClassify;

      console.log(`   ✅ 완료 (${classifyTime}ms)`);
      console.log(`   - 진료과목: ${classification.specialty ?? 'null'}`);
      console.log(`   - 시술명: ${classification.procedure ?? 'null'}`);
      console.log(`   - 핵심 주장: ${JSON.stringify(classification.claims)}`);

      // 3단계: 쿼리 변환
      console.log('');
      console.log('🔄 3단계: Query Rewriting (Claude Haiku)...');
      const startRewrite = Date.now();
      const queries = await rewriteQuery(sample.text, {
        specialty: classification.specialty,
        procedure: classification.procedure,
        claims: classification.claims,
      });
      const rewriteTime = Date.now() - startRewrite;

      console.log(`   ✅ 완료 (${rewriteTime}ms)`);
      console.log('   - 검색 쿼리:');
      queries.forEach((q, i) => console.log(`     ${i + 1}. ${q}`));

      // 결과 비교
      console.log('');
      console.log('📊 기대 결과 비교:');
      console.log(`   - 기대 진료과목: ${sample.expected.specialty}`);
      console.log(`   - 기대 시술명: ${sample.expected.procedure}`);
      console.log(`   - 기대 주장: ${sample.expected.claims.join(', ')}`);

      const totalTime = classifyTime + rewriteTime;
      console.log('');
      console.log(`⏱️  총 소요 시간: ${totalTime}ms`);

    } catch (error) {
      console.error(`   ❌ 오류 발생:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('테스트 완료');
  console.log('='.repeat(60));
}

// 환경변수 체크
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.');
  console.error('   export ANTHROPIC_API_KEY=your-api-key');
  process.exit(1);
}

testClassification().catch(console.error);
