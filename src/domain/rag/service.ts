/**
 * RAG Domain - Service
 * Hybrid Search + RRF 순위 결합
 */

import { ragRepository } from './repository';
import { embeddingProvider } from '@/lib/embedding';
import type { SearchResult, SearchQuery, HybridSearchConfig } from './model';

const DEFAULT_CONFIG: HybridSearchConfig = {
  semanticWeight: 0.6,
  keywordWeight: 0.4,
  topK: 10,
};

export class RagService {
  /**
   * Hybrid Search (시맨틱 + 키워드)
   * RRF(Reciprocal Rank Fusion)로 순위 결합
   */
  async hybridSearch(
    query: SearchQuery,
    config: Partial<HybridSearchConfig> = {}
  ): Promise<SearchResult[]> {
    const { semanticWeight, keywordWeight, topK } = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // 임베딩 생성
    const embedding = query.embedding ?? await embeddingProvider.embed(query.text);

    // 병렬 검색
    const [semanticResults, keywordResults] = await Promise.all([
      ragRepository.searchSemantic(embedding, topK * 2, query.filters),
      ragRepository.searchKeyword(query.text, topK * 2),
    ]);

    // RRF 순위 결합
    const combined = this.reciprocalRankFusion(
      semanticResults,
      keywordResults,
      semanticWeight,
      keywordWeight
    );

    return combined.slice(0, topK);
  }

  /**
   * RRF(Reciprocal Rank Fusion) 알고리즘
   * score = sum(weight / (k + rank)) for each result list
   */
  private reciprocalRankFusion(
    semanticResults: SearchResult[],
    keywordResults: SearchResult[],
    semanticWeight: number,
    keywordWeight: number,
    k: number = 60
  ): SearchResult[] {
    const scores = new Map<number, { score: number; result: SearchResult }>();

    // 시맨틱 결과 점수
    semanticResults.forEach((result, index) => {
      const id = result.chunk.id;
      const score = semanticWeight / (k + index + 1);
      const existing = scores.get(id);
      if (existing) {
        existing.score += score;
      } else {
        scores.set(id, { score, result: { ...result, searchType: 'hybrid' } });
      }
    });

    // 키워드 결과 점수
    keywordResults.forEach((result, index) => {
      const id = result.chunk.id;
      const score = keywordWeight / (k + index + 1);
      const existing = scores.get(id);
      if (existing) {
        existing.score += score;
      } else {
        scores.set(id, { score, result: { ...result, searchType: 'hybrid' } });
      }
    });

    // 점수순 정렬
    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .map(({ result, score }) => ({
        ...result,
        similarity: score, // RRF 점수로 대체
      }));
  }
}

export const ragService = new RagService();
