/**
 * Analysis Domain - Repository
 * 키워드 패턴 로드 (law_articles 테이블에서)
 */

import { ontologyRepository } from '@/domain/ontology/repository';
import type { KeywordPattern } from './model';

export class AnalysisRepository {
  private cachedPatterns: KeywordPattern[] | null = null;

  /**
   * 키워드 패턴 로드 (law_articles.keywords[]에서 동적 로드)
   * ⚠️ 하드코딩 금지 - CLAUDE.md 주의사항 참조
   * ⚠️ keywords는 이미 정규식 패턴이므로 이스케이프하지 않음
   */
  async loadKeywordPatterns(): Promise<KeywordPattern[]> {
    if (this.cachedPatterns) {
      return this.cachedPatterns;
    }

    const articles = await ontologyRepository.getAllArticlesWithKeywords();

    this.cachedPatterns = [];

    for (const article of articles) {
      for (const keyword of article.keywords) {
        try {
          // keywords는 이미 정규식 패턴으로 저장됨 (예: "전[·\\-\\s]?후\\s*(비교|사진)")
          const pattern = new RegExp(keyword, 'gi');
          this.cachedPatterns.push({
            pattern,
            articleId: article.id,
            article: [article.article, article.clause, article.subclause]
              .filter(Boolean)
              .join(' '),
            category: article.title,
          });
        } catch (e) {
          // 잘못된 정규식 패턴은 스킵
          console.warn(`Invalid regex pattern for article ${article.id}: ${keyword}`, e);
        }
      }
    }

    return this.cachedPatterns;
  }

  /**
   * 캐시 무효화 (패턴 업데이트 시)
   */
  invalidateCache(): void {
    this.cachedPatterns = null;
  }
}

export const analysisRepository = new AnalysisRepository();
