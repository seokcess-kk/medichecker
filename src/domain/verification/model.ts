export interface VerifyRequest {
  text: string;
  adType: 'blog' | 'instagram' | 'youtube' | 'other';
}

export interface Violation {
  type: 'expression' | 'omission';
  text: string;
  position?: [number, number];
  article: string;
  description: string;
  confidence: number;
  evidence: string;
  relationPath?: string;
  suggestion: string;
  reviewNote?: string;
}

export interface VerifyResult {
  violations: Violation[];
  riskScore: number;
  summary: string;
  metadata: {
    keywordMatches: number;
    ragChunksUsed: number;
    ontologyChunksUsed: number;
    totalTimeMs: number;
    stageTimings: Record<string, number>;
  };
}

export type VerifyStage =
  | 'keyword_scan'
  | 'classification'
  | 'query_rewrite'
  | 'search'
  | 'relation_enrichment'
  | 'judgment'
  | 'verification'
  | 'complete';

export interface VerifyProgress {
  stage: VerifyStage;
  status: 'running' | 'done';
  partialResult?: Partial<VerifyResult>;
}

export type AdType = 'blog' | 'instagram' | 'youtube' | 'other';

export const AD_TYPE_LABELS: Record<AdType, string> = {
  blog: '블로그',
  instagram: '인스타그램',
  youtube: '유튜브',
  other: '기타',
};

export const STAGE_LABELS: Record<VerifyStage, string> = {
  keyword_scan: '키워드 스캔',
  classification: '분류 완료',
  query_rewrite: '쿼리 변환',
  search: '법령 검색',
  relation_enrichment: '관계 분석',
  judgment: 'AI 판단',
  verification: '검증 완료',
  complete: '완료',
};
