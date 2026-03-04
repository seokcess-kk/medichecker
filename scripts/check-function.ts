import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // 직접 SQL로 키워드 검색 테스트
  const { data, error } = await supabase.rpc('search_keyword_chunks', {
    query_text: '전문의',
    match_count: 3
  });

  console.log('RPC 결과:', { data, error });

  // 직접 SQL 실행으로 테스트
  const { data: rawData, error: rawError } = await supabase
    .from('chunks')
    .select('id, content, article_id')
    .ilike('content', '%전문의%')
    .limit(3);

  console.log('\nilike 검색 결과:', rawData?.length, '건');
  if (rawData) {
    for (const r of rawData) {
      console.log(`  - id=${r.id}, article=${r.article_id}`);
    }
  }
}

check().catch(console.error);
