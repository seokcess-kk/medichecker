/**
 * Analysis Domain - Service
 * 1단계 키워드 스캔 + 2단계 분류 + 3단계 쿼리 변환
 */

import { analysisRepository } from './repository';
import { ontologyRepository } from '@/domain/ontology/repository';
import { classifyContext, rewriteQuery } from '@/lib/claude';
import type { KeywordMatch, KeywordScanResult, ClassificationResult } from './model';

export class AnalysisService {
  /**
   * 1단계: 규칙 기반 키워드 스캔
   * AI 호출 없음, ~50ms 목표
   */
  async scanKeywords(text: string): Promise<KeywordScanResult> {
    const startTime = Date.now();
    const matches: KeywordMatch[] = [];

    // 키워드 패턴 로드 (law_articles에서 동적)
    const patterns = await analysisRepository.loadKeywordPatterns();

    // 패턴 매칭
    for (const { pattern, articleId, article, category } of patterns) {
      let match: RegExpExecArray | null;
      // 패턴 인덱스 리셋
      pattern.lastIndex = 0;

      while ((match = pattern.exec(text)) !== null) {
        matches.push({
          keyword: match[0],
          position: [match.index, match.index + match[0].length],
          articleId,
          article,
          category,
          confidence: 1.0, // 키워드 매칭은 확신도 1.0
        });
      }
    }

    // 중복 제거 (같은 위치에 여러 패턴 매칭 시)
    const uniqueMatches = this.deduplicateMatches(matches);

    return {
      matches: uniqueMatches,
      scannedLength: text.length,
      scanTimeMs: Date.now() - startTime,
    };
  }

  /**
   * 2단계: 컨텍스트 분류 (Claude Haiku)
   * 진료과목, 시술명, 핵심 주장 추출 + 온톨로지 연결
   */
  async classifyContent(
    text: string,
    adType: string
  ): Promise<ClassificationResult> {
    const startTime = Date.now();

    // Claude Haiku로 분류
    const aiResult = await classifyContext(text, adType);

    // 시술명 → procedures 테이블 매칭
    let procedureId: number | null = null;
    if (aiResult.procedure) {
      const procedure = await ontologyRepository.findProcedure(
        aiResult.procedure,
        aiResult.specialty ?? undefined
      );
      if (procedure) {
        procedureId = procedure.id;
      }
    }

    const result: ClassificationResult = {
      specialty: aiResult.specialty,
      procedure: aiResult.procedure,
      adType,
      claims: aiResult.claims,
      procedureId,
      classificationTimeMs: Date.now() - startTime,
    };

    return result;
  }

  /**
   * 3단계: Query Rewriting (Claude Haiku)
   * 광고 표현 → 법률 검색어 변환
   */
  async generateSearchQueries(
    text: string,
    classification: ClassificationResult
  ): Promise<{ queries: string[]; queryRewriteTimeMs: number }> {
    const startTime = Date.now();

    const queries = await rewriteQuery(text, {
      specialty: classification.specialty,
      procedure: classification.procedure,
      claims: classification.claims,
    });

    return {
      queries,
      queryRewriteTimeMs: Date.now() - startTime,
    };
  }

  /**
   * 1~3단계 통합 실행
   */
  async analyzeText(
    text: string,
    adType: string
  ): Promise<{
    keywordScan: KeywordScanResult;
    classification: ClassificationResult;
    searchQueries: string[];
    totalTimeMs: number;
  }> {
    const startTime = Date.now();

    // 1단계: 키워드 스캔 (병렬 가능)
    const keywordScanPromise = this.scanKeywords(text);

    // 2단계: 컨텍스트 분류
    const classificationPromise = this.classifyContent(text, adType);

    // 1, 2단계 병렬 실행
    const [keywordScan, classification] = await Promise.all([
      keywordScanPromise,
      classificationPromise,
    ]);

    // 3단계: 쿼리 변환 (2단계 결과 필요)
    const { queries: searchQueries } = await this.generateSearchQueries(
      text,
      classification
    );

    return {
      keywordScan,
      classification,
      searchQueries,
      totalTimeMs: Date.now() - startTime,
    };
  }

  /**
   * 중복 매칭 제거 (위치 기반)
   */
  private deduplicateMatches(matches: KeywordMatch[]): KeywordMatch[] {
    const seen = new Set<string>();
    return matches.filter((match) => {
      const key = `${match.position[0]}-${match.position[1]}-${match.articleId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const analysisService = new AnalysisService();
