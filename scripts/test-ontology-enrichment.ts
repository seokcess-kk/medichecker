/**
 * 관계 기반 컨텍스트 확장 (4.5단계) 테스트 스크립트
 *
 * 실행: pnpm tsx scripts/test-ontology-enrichment.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { ragService } from '../src/domain/rag/service';
import { ontologyService } from '../src/domain/ontology/service';
import { ontologyRepository } from '../src/domain/ontology/repository';
import type { SearchQuery } from '../src/domain/rag/model';

async function testOntologyEnrichment() {
  console.log('🔗 관계 기반 컨텍스트 확장 (4.5단계) 테스트\n');
  console.log('─'.repeat(80));

  // 테스트 1: 보톡스 관련 쿼리
  console.log('\n📌 테스트 1: 보톡스 전후사진 광고');
  console.log('   4단계 Hybrid Search 실행...');

  const query1: SearchQuery = { text: '보톡스 시술 전후 사진 비교 광고', limit: 5 };
  const searchResults1 = await ragService.hybridSearch(query1);

  console.log(`   4단계 결과: ${searchResults1.length}건`);
  const articleIds1 = [...new Set(searchResults1.map(r => r.chunk.articleId).filter(Boolean))];
  console.log(`   검색된 조항: ${articleIds1.map(id => `${id}호`).join(', ') || '없음'}`);

  // 보톡스 시술 찾기
  const botox = await ontologyRepository.findProcedure('보톡스');
  console.log(`   시술 매칭: ${botox ? `${botox.name} (id=${botox.id})` : '없음'}`);

  // 4.5단계 실행
  console.log('\n   4.5단계 관계 확장 실행...');
  const enriched1 = await ontologyService.enrichContext(
    searchResults1,
    botox?.id ?? null
  );

  console.log(`   관계 확장 결과:`);
  console.log(`     - 기존 청크: ${enriched1.originalResultIds.length}건`);
  console.log(`     - 추가 청크: ${enriched1.relatedChunks.length}건`);
  console.log(`     - 시술 정보: ${enriched1.procedureInfo?.name ?? '없음'}`);
  console.log(`     - 관계 경로: ${enriched1.relationPaths.length}건`);

  if (enriched1.procedureInfo) {
    console.log(`\n   시술 특화 정보 (${enriched1.procedureInfo.name}):`);
    console.log(`     - 필수 고지: ${enriched1.procedureInfo.requiredDisclosures.join(', ')}`);
    console.log(`     - 흔한 위반: ${enriched1.procedureInfo.commonViolations.join(', ')}`);
  }

  if (enriched1.relationPaths.length > 0) {
    console.log('\n   관계 경로 샘플:');
    for (const path of enriched1.relationPaths.slice(0, 3)) {
      console.log(`     - [${path.relationType}] ${path.path.slice(0, 60)}...`);
    }
  }

  // 테스트 2: 임플란트 할인 광고
  console.log('\n' + '─'.repeat(80));
  console.log('\n📌 테스트 2: 임플란트 할인 광고');
  console.log('   4단계 Hybrid Search 실행...');

  const query2: SearchQuery = { text: '임플란트 50% 할인 이벤트', limit: 5 };
  const searchResults2 = await ragService.hybridSearch(query2);

  console.log(`   4단계 결과: ${searchResults2.length}건`);

  // 임플란트 시술 찾기
  const implant = await ontologyRepository.findProcedure('임플란트');
  console.log(`   시술 매칭: ${implant ? `${implant.name} (id=${implant.id})` : '없음'}`);

  // 4.5단계 실행
  console.log('\n   4.5단계 관계 확장 실행...');
  const enriched2 = await ontologyService.enrichContext(
    searchResults2,
    implant?.id ?? null
  );

  console.log(`   관계 확장 결과:`);
  console.log(`     - 추가 청크: ${enriched2.relatedChunks.length}건`);
  console.log(`     - 관계 경로: ${enriched2.relationPaths.length}건`);

  if (enriched2.procedureInfo) {
    console.log(`\n   시술 특화 정보 (${enriched2.procedureInfo.name}):`);
    console.log(`     - 필수 고지: ${enriched2.procedureInfo.requiredDisclosures.join(', ')}`);
    console.log(`     - 흔한 위반: ${enriched2.procedureInfo.commonViolations.join(', ')}`);
  }

  // 테스트 3: 시술 없이 조항만으로 확장
  console.log('\n' + '─'.repeat(80));
  console.log('\n📌 테스트 3: 무자격 표방 (시술 없이 조항으로만 확장)');

  const query3: SearchQuery = { text: '보톡스 전문의 필러 마스터', limit: 5 };
  const searchResults3 = await ragService.hybridSearch(query3);

  console.log(`   4단계 결과: ${searchResults3.length}건`);
  const articleIds3 = [...new Set(searchResults3.map(r => r.chunk.articleId).filter(Boolean))];
  console.log(`   검색된 조항: ${articleIds3.map(id => `${id}호`).join(', ') || '없음'}`);

  // 4.5단계 실행 (시술 ID 없이)
  console.log('\n   4.5단계 관계 확장 실행 (시술 없이)...');
  const enriched3 = await ontologyService.enrichContext(searchResults3, null);

  console.log(`   관계 확장 결과:`);
  console.log(`     - 추가 청크: ${enriched3.relatedChunks.length}건`);
  console.log(`     - 관계 경로: ${enriched3.relationPaths.length}건`);

  // 요약
  console.log('\n' + '─'.repeat(80));
  console.log('\n📊 테스트 요약:');
  console.log(`   테스트 1 (보톡스): 추가 ${enriched1.relatedChunks.length}건, 경로 ${enriched1.relationPaths.length}건`);
  console.log(`   테스트 2 (임플란트): 추가 ${enriched2.relatedChunks.length}건, 경로 ${enriched2.relationPaths.length}건`);
  console.log(`   테스트 3 (무자격): 추가 ${enriched3.relatedChunks.length}건, 경로 ${enriched3.relationPaths.length}건`);

  const totalAdded = enriched1.relatedChunks.length + enriched2.relatedChunks.length + enriched3.relatedChunks.length;
  const totalPaths = enriched1.relationPaths.length + enriched2.relationPaths.length + enriched3.relationPaths.length;

  if (totalAdded > 0 || totalPaths > 0) {
    console.log('\n✅ 관계 기반 확장 동작 확인!');
  } else {
    console.log('\n⚠️  관계 기반 확장 결과 없음 - relations 데이터 확인 필요');
  }

  console.log('\n🎉 테스트 완료!');
}

testOntologyEnrichment().catch(console.error);
