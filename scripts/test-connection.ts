/**
 * DB 연결 테스트 스크립트
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testConnection() {
  console.log('🔌 Supabase 연결 테스트...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. 테이블 확인
  console.log('📋 테이블 확인:');
  const tables = ['law_articles', 'procedures', 'relations', 'chunks'];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: ${count ?? 0}건`);
    }
  }

  // 2. 함수 확인
  console.log('\n📦 함수 확인:');

  // search_similar_chunks
  try {
    const { error } = await supabase.rpc('search_similar_chunks', {
      query_embedding: Array(1536).fill(0),
      match_count: 1,
    });
    console.log(`  ✅ search_similar_chunks: ${error ? '❌ ' + error.message : 'OK'}`);
  } catch (e) {
    console.log(`  ❌ search_similar_chunks: ${e}`);
  }

  // search_keyword_chunks
  try {
    const { error } = await supabase.rpc('search_keyword_chunks', {
      query_text: 'test',
      match_count: 1,
    });
    console.log(`  ✅ search_keyword_chunks: ${error ? '❌ ' + error.message : 'OK'}`);
  } catch (e) {
    console.log(`  ❌ search_keyword_chunks: ${e}`);
  }

  // get_related_context
  try {
    const { error } = await supabase.rpc('get_related_context', {
      input_article_ids: [],
      input_procedure_ids: [],
    });
    console.log(`  ✅ get_related_context: ${error ? '❌ ' + error.message : 'OK'}`);
  } catch (e) {
    console.log(`  ❌ get_related_context: ${e}`);
  }

  console.log('\n✨ 연결 테스트 완료!');
}

testConnection().catch(console.error);
