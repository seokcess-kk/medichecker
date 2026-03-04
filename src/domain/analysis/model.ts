/**
 * Analysis Domain - Model
 * 키워드 스캔 관련 타입 정의
 */

export interface KeywordPattern {
  pattern: RegExp;
  articleId: number;
  article: string; // "제56조 제2항 제2호"
  category: string; // "치료경험담"
}

export interface KeywordMatch {
  keyword: string;
  position: [number, number]; // [start, end]
  articleId: number;
  article: string;
  category: string;
  confidence: number; // 키워드 매칭은 1.0
}

export interface KeywordScanResult {
  matches: KeywordMatch[];
  scannedLength: number;
  scanTimeMs: number;
}

export interface ClassificationResult {
  specialty: string | null; // 진료과목
  procedure: string | null; // 시술명
  adType: string; // 광고 유형
  claims: string[]; // 핵심 주장 리스트
  procedureId: number | null; // 온톨로지 연결
  classificationTimeMs?: number; // 분류 소요 시간
}

export interface QueryRewriteResult {
  queries: string[]; // 변환된 검색 쿼리
  queryRewriteTimeMs: number; // 쿼리 변환 소요 시간
}

export interface AnalysisResult {
  keywordScan: KeywordScanResult;
  classification: ClassificationResult;
  searchQueries: string[];
  totalTimeMs: number;
}
