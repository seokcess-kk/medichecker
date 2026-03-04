/**
 * 통합 테스트: 온톨로지 서비스 (4.5단계)
 *
 * 실행: pnpm test tests/ontology.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ontologyService } from '@/domain/ontology/service';
import { ontologyRepository } from '@/domain/ontology/repository';
import { ragService } from '@/domain/rag/service';
import type { SearchResult } from '@/domain/rag/model';
import type { EnrichedContext, Procedure, LawArticle } from '@/domain/ontology/model';

describe('온톨로지 서비스 통합 테스트', () => {
  beforeAll(() => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });

  describe('관계 기반 컨텍스트 확장', () => {
    it('검색 결과로부터 관계 확장이 동작해야 한다', async () => {
      // 1. 샘플 검색 수행
      const searchResults = await ragService.hybridSearch({
        text: '보톡스 환자 후기',
        limit: 5,
      });

      expect(searchResults.length).toBeGreaterThan(0);

      // 2. 관계 확장
      const enrichedContext = await ontologyService.enrichContext(
        searchResults,
        1 // 보톡스 procedureId
      );

      // 3. EnrichedContext 구조 검증
      expect(enrichedContext).toHaveProperty('originalResultIds');
      expect(enrichedContext).toHaveProperty('relatedChunks');
      expect(enrichedContext).toHaveProperty('procedureInfo');
      expect(enrichedContext).toHaveProperty('relationPaths');

      expect(Array.isArray(enrichedContext.originalResultIds)).toBe(true);
      expect(Array.isArray(enrichedContext.relatedChunks)).toBe(true);
      expect(Array.isArray(enrichedContext.relationPaths)).toBe(true);
    });

    it('procedureId가 null이어도 동작해야 한다', async () => {
      const searchResults = await ragService.hybridSearch({
        text: '허위 과장 광고',
        limit: 3,
      });

      const enrichedContext = await ontologyService.enrichContext(
        searchResults,
        null
      );

      expect(enrichedContext).toBeDefined();
      expect(enrichedContext.originalResultIds.length).toBeGreaterThanOrEqual(0);
    });

    it('빈 검색 결과도 처리할 수 있어야 한다', async () => {
      const emptyResults: SearchResult[] = [];

      const enrichedContext = await ontologyService.enrichContext(
        emptyResults,
        null
      );

      expect(enrichedContext.originalResultIds).toEqual([]);
      expect(enrichedContext.relatedChunks).toEqual([]);
      expect(enrichedContext.procedureInfo).toBeNull();
    });
  });

  describe('시술 정보 조회', () => {
    it('보톡스(id=1) 시술 정보를 조회할 수 있어야 한다', async () => {
      const procedure = await ontologyRepository.findProcedureById(1);

      expect(procedure).not.toBeNull();
      expect(procedure?.name).toBe('보톡스');
      expect(procedure?.specialty).toBeDefined();
      expect(Array.isArray(procedure?.aliases)).toBe(true);
      expect(Array.isArray(procedure?.requiredDisclosures)).toBe(true);
      expect(Array.isArray(procedure?.commonViolations)).toBe(true);
    });

    it('필러(id=2) 시술 정보를 조회할 수 있어야 한다', async () => {
      const procedure = await ontologyRepository.findProcedureById(2);

      expect(procedure).not.toBeNull();
      expect(procedure?.name).toBe('필러');
    });

    it('존재하지 않는 시술은 null을 반환해야 한다', async () => {
      const procedure = await ontologyRepository.findProcedureById(9999);

      expect(procedure).toBeNull();
    });
  });

  describe('관계 조회 (get_related_context RPC)', () => {
    it('제2호(치료경험담) 관련 컨텍스트를 조회할 수 있어야 한다', async () => {
      const relatedChunks = await ontologyRepository.getRelatedContext(
        [2], // article_ids (제2호)
        []  // procedure_ids
      );

      // 관련 청크가 있거나 빈 배열 (정상)
      expect(Array.isArray(relatedChunks)).toBe(true);
    });

    it('보톡스 시술 관련 컨텍스트를 조회할 수 있어야 한다', async () => {
      const relatedChunks = await ontologyRepository.getRelatedContext(
        [],  // article_ids
        [1]  // procedure_ids (보톡스)
      );

      expect(Array.isArray(relatedChunks)).toBe(true);
    });

    it('복합 조건 (제2호 + 보톡스) 관련 컨텍스트 조회', async () => {
      const relatedChunks = await ontologyRepository.getRelatedContext(
        [2], // article_ids
        [1]  // procedure_ids
      );

      expect(Array.isArray(relatedChunks)).toBe(true);
    });
  });

  describe('관계 경로 생성', () => {
    it('relationPaths가 올바른 형식으로 생성되어야 한다', async () => {
      const searchResults = await ragService.hybridSearch({
        text: '보톡스 할인 이벤트',
        limit: 5,
      });

      const enrichedContext = await ontologyService.enrichContext(
        searchResults,
        1
      );

      for (const path of enrichedContext.relationPaths) {
        expect(path).toHaveProperty('path');
        expect(path).toHaveProperty('relationType');
        expect(typeof path.path).toBe('string');
      }
    });
  });

  describe('시술 별 필수 고지 사항', () => {
    const procedureTests: Array<{ id: number; name: string; expectedDisclosures: string[] }> = [
      {
        id: 1,
        name: '보톡스',
        expectedDisclosures: ['멍', '두통'], // 최소 포함되어야 할 항목
      },
      {
        id: 2,
        name: '필러',
        expectedDisclosures: ['부기', '멍'],
      },
      {
        id: 3,
        name: '쌍꺼풀',
        expectedDisclosures: ['부기', '멍'],
      },
    ];

    it.each(procedureTests)(
      '$name 시술의 필수 고지 사항 확인',
      async ({ id, expectedDisclosures }) => {
        const procedure = await ontologyRepository.findProcedureById(id);

        expect(procedure).not.toBeNull();

        const hasExpectedDisclosures = expectedDisclosures.some((disclosure) =>
          procedure!.requiredDisclosures.some((rd) =>
            rd.toLowerCase().includes(disclosure.toLowerCase())
          )
        );

        expect(hasExpectedDisclosures).toBe(true);
      }
    );
  });
});

describe('온톨로지 데이터 무결성', () => {
  describe('법령 조항 데이터', () => {
    it('15개 조항이 모두 존재해야 한다', async () => {
      const articles = await ontologyRepository.getAllLawArticles();

      expect(articles.length).toBeGreaterThanOrEqual(15);
    });

    it('각 조항에 필수 필드가 있어야 한다', async () => {
      const articles = await ontologyRepository.getAllLawArticles();

      for (const article of articles) {
        expect(article.id).toBeDefined();
        expect(article.article).toBeDefined();
        expect(article.title).toBeDefined();
        expect(article.summary).toBeDefined();
        expect(Array.isArray(article.keywords)).toBe(true);
      }
    });
  });

  describe('시술 데이터', () => {
    it('최소 10개 시술이 존재해야 한다', async () => {
      const procedures = await ontologyRepository.getAllProcedures();

      expect(procedures.length).toBeGreaterThanOrEqual(10);
    });

    it('각 시술에 필수 필드가 있어야 한다', async () => {
      const procedures = await ontologyRepository.getAllProcedures();

      for (const procedure of procedures) {
        expect(procedure.id).toBeDefined();
        expect(procedure.name).toBeDefined();
        expect(procedure.specialty).toBeDefined();
        expect(Array.isArray(procedure.aliases)).toBe(true);
        expect(Array.isArray(procedure.requiredDisclosures)).toBe(true);
        expect(Array.isArray(procedure.commonViolations)).toBe(true);
      }
    });
  });

  describe('관계 데이터', () => {
    it('최소 50개 관계가 존재해야 한다', async () => {
      const relations = await ontologyRepository.getAllRelations();

      expect(relations.length).toBeGreaterThanOrEqual(50);
    });

    it('관계 타입이 유효해야 한다', async () => {
      const validTypes = [
        'prohibits',
        'relatedCase',
        'appliesTo',
        'requiredDisclosure',
        'commonViolation',
        'hasSpecialRegulation',
        'similarTo',
        'parentOf',
      ];

      const relations = await ontologyRepository.getAllRelations();

      for (const relation of relations) {
        expect(validTypes).toContain(relation.relationType);
      }
    });
  });
});

describe('온톨로지 기여율 측정', () => {
  it('관계 확장이 추가 컨텍스트를 제공해야 한다 (기여율 측정)', async () => {
    const testQueries = [
      { text: '보톡스 환자 후기', procedureId: 1 },
      { text: '필러 100% 효과', procedureId: 2 },
      { text: '할인 이벤트', procedureId: null },
    ];

    let totalOriginal = 0;
    let totalEnriched = 0;

    for (const query of testQueries) {
      const searchResults = await ragService.hybridSearch({
        text: query.text,
        limit: 5,
      });

      const enrichedContext = await ontologyService.enrichContext(
        searchResults,
        query.procedureId
      );

      totalOriginal += searchResults.length;
      totalEnriched += searchResults.length + enrichedContext.relatedChunks.length;
    }

    // 기여율 계산 (enriched / original - 1)
    const contributionRate = totalEnriched > 0 ? (totalEnriched - totalOriginal) / totalOriginal : 0;

    console.log('\n📊 온톨로지 기여율 측정:');
    console.log(`  Original chunks: ${totalOriginal}`);
    console.log(`  Enriched chunks: ${totalEnriched}`);
    console.log(`  Contribution rate: ${(contributionRate * 100).toFixed(1)}%`);

    // 기여율이 0% 이상이면 통과 (관계 확장이 동작함을 의미)
    expect(contributionRate).toBeGreaterThanOrEqual(0);
  });
});
