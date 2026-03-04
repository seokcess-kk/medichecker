/**
 * Hybrid Search (4단계) 테스트 스크립트
 *
 * 실행: pnpm tsx scripts/test-hybrid-search.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// 환경변수 설정 후 import
import { ragService } from '../src/domain/rag/service';
import type { SearchQuery } from '../src/domain/rag/model';

const TEST_QUERIES: Array<{ query: string; description: string }> = [
  {
    query: '보톡스 시술 전후사진 비교',
    description: '전후사진 (2호)',
  },
  {
    query: '100% 성공률 부작용 없는 시술',
    description: '거짓/과장 (3호, 8호)',
  },
  {
    query: '필러 부작용 고지 의무',
    description: '부작용 누락 (7호)',
  },
  {
    query: '보톡스 전문의 자격',
    description: '무자격 표방 (9호)',
  },
  {
    query: '임플란트 할인 이벤트',
    description: '할인 광고 (13호)',
  },
];

async function testHybridSearch() {
  console.log('🔍 Hybrid Search (4단계) 테스트\n');
  console.log('설정: 시맨틱 0.6 + 키워드 0.4, Top-10\n');
  console.log('─'.repeat(80));

  for (const testCase of TEST_QUERIES) {
    console.log(`\n📌 ${testCase.description}`);
    console.log(`   쿼리: "${testCase.query}"`);

    const searchQuery: SearchQuery = {
      text: testCase.query,
      limit: 10,
    };

    try {
      const startTime = Date.now();
      const results = await ragService.hybridSearch(searchQuery);
      const elapsed = Date.now() - startTime;

      console.log(`   소요시간: ${elapsed}ms`);
      console.log(`   결과: ${results.length}건`);

      // 상위 5건 출력
      console.log('   Top-5:');
      for (let i = 0; i < Math.min(5, results.length); i++) {
        const r = results[i];
        const source = r.chunk.metadata.source;
        const articleId = r.chunk.articleId;
        const preview = r.chunk.content.slice(0, 50).replace(/\n/g, ' ');
        console.log(
          `     ${i + 1}. [${source}] ${articleId ? `${articleId}호` : '-'} | ${r.similarity.toFixed(4)} | ${preview}...`
        );
      }

      // 검색된 조항 ID 집계
      const articleIds = [
        ...new Set(
          results
            .map((r) => r.chunk.articleId)
            .filter((id): id is number => id !== null)
        ),
      ];
      console.log(`   조항: ${articleIds.map((id) => `${id}호`).join(', ') || '없음'}`);
    } catch (error) {
      console.log(`   ❌ 에러: ${error}`);
    }
  }

  console.log('\n' + '─'.repeat(80));
  console.log('\n✅ Hybrid Search 테스트 완료!');
}

testHybridSearch().catch(console.error);
