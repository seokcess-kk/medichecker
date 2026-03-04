/**
 * Ontology Domain - Service
 * 관계 기반 컨텍스트 확장 (4.5단계)
 */

import { ontologyRepository } from './repository';
import type { SearchResult } from '@/domain/rag/model';
import type { EnrichedContext, RelationPath, Procedure } from './model';

export class OntologyService {
  /**
   * 4.5단계: 관계 기반 컨텍스트 확장
   * 검색 결과의 article_id, procedure_id를 기반으로 관련 컨텍스트 수집
   */
  async enrichContext(
    searchResults: SearchResult[],
    procedureId: number | null
  ): Promise<EnrichedContext> {
    // 검색 결과에서 article_id, procedure_id 수집
    const articleIds = [
      ...new Set(
        searchResults
          .map((r) => r.chunk.articleId)
          .filter((id): id is number => id !== null)
      ),
    ];

    const procedureIds = procedureId
      ? [procedureId]
      : [
          ...new Set(
            searchResults
              .map((r) => r.chunk.procedureId)
              .filter((id): id is number => id !== null)
          ),
        ];

    // 관계 기반 확장 (1홉 탐색)
    const relatedChunks = await ontologyRepository.getRelatedContext(
      articleIds,
      procedureIds
    );

    // 시술 특화 정보
    let procedureInfo: Procedure | null = null;
    if (procedureIds.length > 0) {
      procedureInfo = await ontologyRepository.findProcedureById(procedureIds[0]);
    }

    // 중복 제거 (이미 검색된 청크 제외)
    const existingIds = new Set(searchResults.map((r) => r.chunk.id));
    const newChunks = relatedChunks.filter((c) => !existingIds.has(c.chunkId));

    // 판단 근거 경로 생성
    const relationPaths = this.buildRelationPaths(relatedChunks);

    return {
      originalResultIds: searchResults.map((r) => r.chunk.id),
      relatedChunks: newChunks,
      procedureInfo,
      relationPaths,
    };
  }

  /**
   * 판단 근거 경로 생성 (5단계에 전달)
   * "제56조 제2항 제2호 → relatedCase → [사례 요약]"
   */
  private buildRelationPaths(
    relatedChunks: EnrichedContext['relatedChunks']
  ): RelationPath[] {
    return relatedChunks.map((chunk) => ({
      path: `${chunk.relationSource} → ${chunk.relationType} → ${chunk.content.slice(0, 50)}...`,
      relationType: chunk.relationType,
    }));
  }
}

export const ontologyService = new OntologyService();
