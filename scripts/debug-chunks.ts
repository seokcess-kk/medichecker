import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debug() {
  // 조항별 청크 수 확인
  const { data: all } = await supabase
    .from('chunks')
    .select('article_id');

  const counts: Record<number, number> = {};
  for (const c of all || []) {
    if (c.article_id) {
      counts[c.article_id] = (counts[c.article_id] || 0) + 1;
    }
  }
  console.log('조항별 청크 수:');
  for (let i = 1; i <= 15; i++) {
    console.log(`  ${i}호: ${counts[i] || 0}건`);
  }

  // 키워드 검색 테스트
  console.log('\n키워드 검색 테스트:');
  const tests = ['전문의', '부작용', '인증', '다이어트'];
  for (const q of tests) {
    const { data, error } = await supabase.rpc('search_keyword_chunks', {
      query_text: q,
      match_count: 3
    });
    if (error) {
      console.log(`  "${q}": 에러 - ${error.message}`);
    } else {
      console.log(`  "${q}": ${data?.length || 0}건`);
    }
  }
}

debug().catch(console.error);
