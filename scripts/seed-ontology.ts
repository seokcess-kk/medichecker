/**
 * 온톨로지 시드 스크립트
 * law-articles, procedures, relations 테이블에 데이터 적재
 *
 * 실행: pnpm tsx scripts/seed-ontology.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface LawArticle {
  id: number;
  article: string;
  clause: string | null;
  subclause: string | null;
  title: string;
  summary: string;
  fullText: string | null;
  penalty: string | null;
  keywords: string[];
  detectionDifficulty: 'keyword' | 'context' | 'complex';
}

interface Procedure {
  id: number;
  name: string;
  specialty: string;
  aliases: string[];
  requiredDisclosures: string[];
  commonViolations: string[];
  specialRegulations: string[];
}

interface Relation {
  id: number;
  sourceType: string;
  sourceId: number;
  relationType: string;
  targetType: string;
  targetId: number;
  weight: number;
  metadata: Record<string, unknown>;
}

async function seedOntology() {
  console.log('🌱 온톨로지 시드 시작...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);
  const dataDir = path.join(process.cwd(), 'src/data/seed');

  // 1. 기존 데이터 삭제 (순서 중요: FK 제약 때문에 relations → chunks → procedures/law_articles)
  console.log('🗑️  기존 데이터 정리...');

  await supabase.from('relations').delete().neq('id', 0);
  await supabase.from('chunks').delete().neq('id', 0);
  await supabase.from('procedures').delete().neq('id', 0);
  await supabase.from('law_articles').delete().neq('id', 0);

  console.log('  ✅ 기존 데이터 삭제 완료\n');

  // 2. law_articles 적재
  console.log('📜 law_articles 적재...');
  const lawArticlesRaw = fs.readFileSync(
    path.join(dataDir, 'law-articles.json'),
    'utf-8'
  );
  const lawArticles: LawArticle[] = JSON.parse(lawArticlesRaw);

  const lawArticlesData = lawArticles.map((a) => ({
    id: a.id,
    article: a.article,
    clause: a.clause,
    subclause: a.subclause,
    title: a.title,
    summary: a.summary,
    full_text: a.fullText,
    penalty: a.penalty,
    keywords: a.keywords,
    detection_difficulty: a.detectionDifficulty,
  }));

  const { error: lawError } = await supabase
    .from('law_articles')
    .insert(lawArticlesData);

  if (lawError) {
    console.error('  ❌ law_articles 에러:', lawError.message);
    process.exit(1);
  }
  console.log(`  ✅ ${lawArticles.length}건 적재 완료\n`);

  // 3. procedures 적재
  console.log('💉 procedures 적재...');
  const proceduresRaw = fs.readFileSync(
    path.join(dataDir, 'procedures.json'),
    'utf-8'
  );
  const procedures: Procedure[] = JSON.parse(proceduresRaw);

  const proceduresData = procedures.map((p) => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty,
    aliases: p.aliases,
    required_disclosures: p.requiredDisclosures,
    common_violations: p.commonViolations,
    special_regulations: p.specialRegulations,
  }));

  const { error: procError } = await supabase
    .from('procedures')
    .insert(proceduresData);

  if (procError) {
    console.error('  ❌ procedures 에러:', procError.message);
    process.exit(1);
  }
  console.log(`  ✅ ${procedures.length}건 적재 완료\n`);

  // 4. relations 적재
  console.log('🔗 relations 적재...');
  const relationsRaw = fs.readFileSync(
    path.join(dataDir, 'relations.json'),
    'utf-8'
  );
  const relations: Relation[] = JSON.parse(relationsRaw);

  const relationsData = relations.map((r) => ({
    id: r.id,
    source_type: r.sourceType,
    source_id: r.sourceId,
    relation_type: r.relationType,
    target_type: r.targetType,
    target_id: r.targetId,
    weight: r.weight,
    metadata: r.metadata,
  }));

  const { error: relError } = await supabase
    .from('relations')
    .insert(relationsData);

  if (relError) {
    console.error('  ❌ relations 에러:', relError.message);
    process.exit(1);
  }
  console.log(`  ✅ ${relations.length}건 적재 완료\n`);

  // 5. 검증
  console.log('✨ 적재 결과 확인:');
  const { count: lawCount } = await supabase
    .from('law_articles')
    .select('*', { count: 'exact', head: true });
  const { count: procCount } = await supabase
    .from('procedures')
    .select('*', { count: 'exact', head: true });
  const { count: relCount } = await supabase
    .from('relations')
    .select('*', { count: 'exact', head: true });

  console.log(`  📜 law_articles: ${lawCount}건`);
  console.log(`  💉 procedures: ${procCount}건`);
  console.log(`  🔗 relations: ${relCount}건`);

  console.log('\n🎉 온톨로지 시드 완료!');
}

seedOntology().catch(console.error);
