/**
 * 검색 품질 테스트 스크립트
 * 10건 테스트 쿼리로 Hit Rate 측정
 *
 * 실행: pnpm tsx scripts/eval/search-quality-test.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

const EMBED_MODEL = 'text-embedding-3-small';

// 테스트 쿼리 - 실제 광고 표현과 예상 관련 조항
interface TestQuery {
  query: string;
  description: string;
  expectedArticleIds: number[]; // 관련 있어야 할 조항 ID
  expectedSource?: string; // 'law' | 'guideline' | 'case'
}

const TEST_QUERIES: TestQuery[] = [
  {
    query: '보톡스 시술 후 10살 어려진 느낌! 정말 추천해요',
    description: '환자 경험담 + 추천',
    expectedArticleIds: [2], // 제2호 치료경험담
  },
  {
    query: '시술 전후 사진을 보시면 효과를 확인하실 수 있습니다',
    description: '전후사진 비교',
    expectedArticleIds: [2], // 제2호
  },
  {
    query: '100% 성공률, 부작용 없는 안전한 코성형',
    description: '거짓 주장',
    expectedArticleIds: [3], // 제3호 거짓광고
  },
  {
    query: '지역 최고 실력! 다른 병원과 비교 불가',
    description: '비교 광고',
    expectedArticleIds: [4], // 제4호 비교광고
  },
  {
    query: '필러 시술 간단하고 10분이면 끝! 바로 일상 복귀',
    description: '부작용 정보 누락',
    expectedArticleIds: [7], // 제7호 부작용누락
  },
  {
    query: '기적 같은 변화! 마법처럼 사라지는 주름',
    description: '과장 표현',
    expectedArticleIds: [8], // 제8호 과장광고
  },
  {
    query: '보톡스 전문의, 필러 마스터 원장님',
    description: '무자격 표방',
    expectedArticleIds: [9], // 제9호 무자격표방
  },
  {
    query: '임플란트 50% 할인 이벤트! 지금 바로 예약하세요',
    description: '할인 광고 (조건 불명확)',
    expectedArticleIds: [13], // 제13호 할인허위광고
  },
  {
    query: '2024 베스트 병원 선정! OO매거진 인증',
    description: '비공인 인증',
    expectedArticleIds: [14], // 제14호 비공인인증
  },
  {
    query: '한방 다이어트로 3개월 20kg 감량 성공! 요요 없어요',
    description: '복합 위반 (경험담+거짓+과장)',
    expectedArticleIds: [2, 3, 8], // 제2호, 제3호, 제8호
  },
];

async function runSearchQualityTest() {
  console.log('🔍 검색 품질 테스트 시작...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);
  const openai = new OpenAI({ apiKey: openaiKey });

  let totalHits = 0;
  let totalExpected = 0;
  const results: Array<{
    query: string;
    description: string;
    hit: boolean;
    expected: number[];
    found: number[];
    details: string;
  }> = [];

  for (const testCase of TEST_QUERIES) {
    // 1. 쿼리 임베딩 생성
    const embeddingResponse = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: testCase.query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. 시맨틱 검색 (Top-5)
    const { data: semanticResults, error: semError } = await supabase.rpc(
      'search_similar_chunks',
      {
        query_embedding: queryEmbedding,
        match_count: 5,
      }
    );

    if (semError) {
      console.error(`  ❌ 시맨틱 검색 에러: ${semError.message}`);
      continue;
    }

    // 3. 키워드 검색 (Top-5)
    const { data: keywordResults, error: kwError } = await supabase.rpc(
      'search_keyword_chunks',
      {
        query_text: testCase.query,
        match_count: 5,
      }
    );

    // 키워드 검색 에러는 무시 (빈 테이블에서 발생할 수 있음)
    const kwResults = kwError ? [] : (keywordResults || []);

    // 4. 결과 병합 (중복 제거)
    const allResults = [...(semanticResults || [])];
    const seenIds = new Set(allResults.map((r: { id: number }) => r.id));

    for (const r of kwResults) {
      if (!seenIds.has(r.id)) {
        allResults.push(r);
        seenIds.add(r.id);
      }
    }

    // 5. 찾은 조항 ID 수집
    const foundArticleIds = [
      ...new Set(
        allResults
          .map((r: { article_id: number | null }) => r.article_id)
          .filter((id): id is number => id !== null)
      ),
    ];

    // 6. Hit 판정 (예상 조항 중 하나라도 찾았는지)
    const hit = testCase.expectedArticleIds.some((expected) =>
      foundArticleIds.includes(expected)
    );

    if (hit) {
      totalHits++;
    }
    totalExpected++;

    // 7. 결과 기록
    results.push({
      query: testCase.query.slice(0, 40) + (testCase.query.length > 40 ? '...' : ''),
      description: testCase.description,
      hit,
      expected: testCase.expectedArticleIds,
      found: foundArticleIds,
      details: hit ? '✅' : '❌',
    });

    // Rate limit 방지
    await sleep(100);
  }

  // 결과 출력
  console.log('📊 테스트 결과:\n');
  console.log('─'.repeat(80));
  console.log(
    '상태 | 설명              | 예상 조항 | 검색된 조항 | 쿼리'
  );
  console.log('─'.repeat(80));

  for (const r of results) {
    const expectedStr = r.expected.map((id) => `${id}호`).join(',');
    const foundStr = r.found.length > 0 ? r.found.map((id) => `${id}호`).join(',') : '-';
    console.log(
      `${r.details}   | ${r.description.padEnd(16)} | ${expectedStr.padEnd(9)} | ${foundStr.padEnd(11)} | ${r.query}`
    );
  }

  console.log('─'.repeat(80));

  // Hit Rate 계산
  const hitRate = (totalHits / totalExpected) * 100;
  console.log(`\n📈 Hit Rate: ${totalHits}/${totalExpected} = ${hitRate.toFixed(1)}%`);

  if (hitRate >= 80) {
    console.log('✅ 목표 달성! (≥ 80%)');
  } else {
    console.log('⚠️  목표 미달 (< 80%) - 개선 필요');

    // 실패 케이스 분석
    console.log('\n📋 실패 케이스 분석:');
    for (const r of results.filter((r) => !r.hit)) {
      console.log(`  - ${r.description}: 예상 ${r.expected.join(',')}호, 검색됨 ${r.found.length > 0 ? r.found.join(',') + '호' : '없음'}`);
    }
  }

  // 관계 확장 테스트
  console.log('\n🔗 관계 기반 확장 테스트:');
  await testRelationExpansion(supabase);

  console.log('\n🎉 검색 품질 테스트 완료!');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function testRelationExpansion(supabase: SupabaseClient<any>) {
  // 보톡스(procedure_id=1)에 연결된 조항 확인
  const { data: botoxRelations, error } = await supabase.rpc(
    'get_related_context',
    {
      input_article_ids: [2], // 제2호 (치료경험담)
      input_procedure_ids: [1], // 보톡스
    } as unknown as undefined
  );

  if (error) {
    console.log(`  ❌ 관계 확장 에러: ${error.message}`);
    return;
  }

  const relatedCount = (botoxRelations as unknown[])?.length || 0;
  console.log(`  보톡스 + 제2호 관련 컨텍스트: ${relatedCount}건`);

  if (relatedCount > 0) {
    console.log('  ✅ 관계 기반 확장 동작 확인');
  } else {
    console.log('  ⚠️  관계 기반 확장 결과 없음 (정상일 수 있음)');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

runSearchQualityTest().catch(console.error);
