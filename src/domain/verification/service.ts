/**
 * Verification Domain - Service
 * 7단계 파이프라인 오케스트레이션
 */

import type { VerifyRequest, VerifyResult, VerifyProgress, VerifyStage } from './model';
import { analysisService } from '@/domain/analysis/service';
import { ragService } from '@/domain/rag/service';
import { ontologyService } from '@/domain/ontology/service';
import { judgeViolation, verifySelf } from '@/lib/claude';
import type { SearchResult } from '@/domain/rag/model';
import type { EnrichedContext } from '@/domain/ontology/model';

export interface VerifyOptions {
  useOntology?: boolean; // default: true (A/B 테스트용)
}

export class VerificationService {
  /**
   * 7단계 파이프라인 실행
   * 1→2→3→4→4.5→5→6
   */
  async verify(
    request: VerifyRequest,
    onProgress?: (progress: VerifyProgress) => void,
    options?: VerifyOptions
  ): Promise<VerifyResult> {
    const useOntology = options?.useOntology ?? true;
    const startTime = Date.now();
    const stageTimings: Record<string, number> = {};

    const emitProgress = (stage: VerifyStage, status: 'running' | 'done') => {
      onProgress?.({ stage, status });
    };

    // ============================================================
    // [1단계] 키워드 스캔 + [2단계] 컨텍스트 분류 (병렬)
    // ============================================================
    emitProgress('keyword_scan', 'running');
    const keywordStart = Date.now();

    const keywordScanPromise = analysisService.scanKeywords(request.text);
    const classificationPromise = analysisService.classifyContent(
      request.text,
      request.adType
    );

    // 1, 2단계 병렬 실행
    const [keywordScan, classification] = await Promise.all([
      keywordScanPromise,
      classificationPromise,
    ]);

    stageTimings['keyword_scan'] = Date.now() - keywordStart;
    emitProgress('keyword_scan', 'done');

    emitProgress('classification', 'running');
    stageTimings['classification'] = classification.classificationTimeMs ?? 0;
    emitProgress('classification', 'done');

    // ============================================================
    // [3단계] Query Rewriting
    // ============================================================
    emitProgress('query_rewrite', 'running');
    const queryStart = Date.now();

    const { queries: searchQueries } = await analysisService.generateSearchQueries(
      request.text,
      classification
    );

    stageTimings['query_rewrite'] = Date.now() - queryStart;
    emitProgress('query_rewrite', 'done');

    // ============================================================
    // [4단계] Hybrid Search
    // ============================================================
    emitProgress('search', 'running');
    const searchStart = Date.now();

    // 모든 쿼리로 검색 후 병합
    const allSearchResults: SearchResult[] = [];
    const seenChunkIds = new Set<number>();

    for (const query of searchQueries) {
      const results = await ragService.hybridSearch({
        text: query,
        limit: 5,
      });

      // 중복 제거하면서 병합
      for (const result of results) {
        if (!seenChunkIds.has(result.chunk.id)) {
          seenChunkIds.add(result.chunk.id);
          allSearchResults.push(result);
        }
      }
    }

    // 유사도 기준 정렬 후 상위 10개
    allSearchResults.sort((a, b) => b.similarity - a.similarity);
    const topSearchResults = allSearchResults.slice(0, 10);

    stageTimings['search'] = Date.now() - searchStart;
    emitProgress('search', 'done');

    // ============================================================
    // [4.5단계] 관계 기반 컨텍스트 확장 (useOntology=false면 스킵)
    // ============================================================
    emitProgress('relation_enrichment', 'running');
    const enrichStart = Date.now();

    let enrichedContext: EnrichedContext;
    if (useOntology) {
      enrichedContext = await ontologyService.enrichContext(
        topSearchResults,
        classification.procedureId
      );
    } else {
      // 온톨로지 비활성화 시 빈 컨텍스트
      enrichedContext = {
        originalResultIds: topSearchResults.map((r) => r.chunk.id),
        relatedChunks: [],
        procedureInfo: null,
        relationPaths: [],
      };
    }

    stageTimings['relation_enrichment'] = Date.now() - enrichStart;
    emitProgress('relation_enrichment', 'done');

    // ============================================================
    // [5단계] 위반 판단 (Claude Sonnet)
    // ============================================================
    emitProgress('judgment', 'running');
    const judgmentStart = Date.now();

    const initialJudgment = await judgeViolation(
      request.text,
      request.adType,
      topSearchResults,
      enrichedContext
    );

    stageTimings['judgment'] = Date.now() - judgmentStart;
    emitProgress('judgment', 'done');

    // ============================================================
    // [6단계] Self-Verification (Claude Sonnet)
    // ============================================================
    emitProgress('verification', 'running');
    const verifyStart = Date.now();

    // 컨텍스트 요약 구성
    const contextSummary = this.buildContextSummary(
      topSearchResults,
      enrichedContext
    );

    const verificationResult = await verifySelf(
      request.text,
      initialJudgment,
      contextSummary
    );

    stageTimings['verification'] = Date.now() - verifyStart;
    emitProgress('verification', 'done');

    // ============================================================
    // 완료
    // ============================================================
    emitProgress('complete', 'done');

    return {
      violations: verificationResult.finalViolations,
      riskScore: verificationResult.finalRiskScore,
      summary: verificationResult.finalSummary,
      metadata: {
        keywordMatches: keywordScan.matches.length,
        ragChunksUsed: topSearchResults.length,
        ontologyChunksUsed: enrichedContext.relatedChunks.length,
        totalTimeMs: Date.now() - startTime,
        stageTimings,
      },
    };
  }

  /**
   * 컨텍스트 요약 (6단계 참조용)
   */
  private buildContextSummary(
    searchResults: SearchResult[],
    enrichedContext: EnrichedContext
  ): string {
    const parts: string[] = [];

    // 검색 결과 요약
    parts.push('## 검색 결과');
    for (const result of searchResults.slice(0, 5)) {
      const source = result.chunk.metadata.source as string;
      const articleId = result.chunk.articleId;
      parts.push(
        `- [${source}] ${articleId ? `${articleId}호` : '-'}: ${result.chunk.content.slice(0, 100)}...`
      );
    }

    // 관계 경로 요약
    if (enrichedContext.relationPaths.length > 0) {
      parts.push('\n## 관계 경로');
      for (const path of enrichedContext.relationPaths.slice(0, 3)) {
        parts.push(`- [${path.relationType}] ${path.path}`);
      }
    }

    // 시술 특화 정보
    if (enrichedContext.procedureInfo) {
      parts.push('\n## 시술 특화 정보');
      parts.push(`- 시술: ${enrichedContext.procedureInfo.name}`);
      parts.push(
        `- 필수 고지: ${enrichedContext.procedureInfo.requiredDisclosures.join(', ')}`
      );
      parts.push(
        `- 흔한 위반: ${enrichedContext.procedureInfo.commonViolations.join(', ')}`
      );
    }

    return parts.join('\n');
  }
}

export const verificationService = new VerificationService();
