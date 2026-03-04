/**
 * 벡터 시드 스크립트
 * chunks 테이블에 법령/해설서/사례 데이터 + 임베딩 적재
 *
 * 실행: pnpm tsx scripts/seed-vectors.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

interface Chunk {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  articleId: number | null;
  procedureId: number | null;
}

const BATCH_SIZE = 20; // OpenAI 배치 크기
const EMBED_MODEL = 'text-embedding-3-small';

async function seedVectors() {
  console.log('🌱 벡터 시드 시작...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);
  const openai = new OpenAI({ apiKey: openaiKey });
  const dataDir = path.join(process.cwd(), 'src/data/seed');

  // 1. 청크 파일 로드
  console.log('📄 청크 파일 로드...');

  const lawChunks: Chunk[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'law-chunks.json'), 'utf-8')
  );
  const guidelinesChunks: Chunk[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'guidelines-chunks.json'), 'utf-8')
  );
  const casesChunks: Chunk[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'cases-chunks.json'), 'utf-8')
  );

  const allChunks = [...lawChunks, ...guidelinesChunks, ...casesChunks];
  console.log(`  📜 법령: ${lawChunks.length}건`);
  console.log(`  📖 해설서: ${guidelinesChunks.length}건`);
  console.log(`  📋 사례: ${casesChunks.length}건`);
  console.log(`  📊 총: ${allChunks.length}건\n`);

  // 2. 기존 청크 삭제 (온톨로지 시드에서 이미 삭제했을 수 있지만 안전하게)
  console.log('🗑️  기존 chunks 정리...');
  await supabase.from('chunks').delete().neq('id', 0);
  console.log('  ✅ 삭제 완료\n');

  // 3. 배치로 임베딩 생성 및 적재
  console.log('🔢 임베딩 생성 및 적재...');

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => normalizeText(c.content));

    try {
      // 임베딩 생성
      const embeddingResponse = await openai.embeddings.create({
        model: EMBED_MODEL,
        input: texts,
      });

      // DB 적재용 데이터 구성
      const insertData = batch.map((chunk, idx) => ({
        id: chunk.id,
        content: chunk.content,
        embedding: embeddingResponse.data[idx].embedding,
        metadata: chunk.metadata,
        article_id: chunk.articleId,
        procedure_id: chunk.procedureId,
      }));

      // DB 적재
      const { error } = await supabase.from('chunks').insert(insertData);

      if (error) {
        console.error(`  ❌ 배치 ${i / BATCH_SIZE + 1} 에러:`, error.message);
        errors += batch.length;
      } else {
        processed += batch.length;
        const progress = Math.round((processed / allChunks.length) * 100);
        process.stdout.write(`\r  진행: ${processed}/${allChunks.length} (${progress}%)`);
      }

      // Rate limit 방지
      await sleep(100);
    } catch (e) {
      console.error(`  ❌ 배치 ${i / BATCH_SIZE + 1} 예외:`, e);
      errors += batch.length;
    }
  }

  console.log('\n');

  // 4. 검증
  console.log('✨ 적재 결과 확인:');
  const { count } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true });

  console.log(`  📊 chunks: ${count}건`);
  console.log(`  ✅ 성공: ${processed}건`);
  if (errors > 0) {
    console.log(`  ❌ 실패: ${errors}건`);
  }

  // 5. 임베딩 차원 확인
  const { data: sample } = await supabase
    .from('chunks')
    .select('embedding')
    .limit(1)
    .single();

  if (sample?.embedding) {
    const dim = Array.isArray(sample.embedding)
      ? sample.embedding.length
      : 'unknown';
    console.log(`  📐 임베딩 차원: ${dim}`);
  }

  console.log('\n🎉 벡터 시드 완료!');
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

seedVectors().catch(console.error);
