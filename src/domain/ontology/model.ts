/**
 * Ontology Domain - Model
 * 온톨로지 노드/엣지 타입 정의
 */

export interface LawArticle {
  id: number;
  article: string; // "제56조"
  clause: string | null; // "제2항"
  subclause: string | null; // "제2호"
  title: string; // "치료경험담"
  summary: string; // 금지 행위 1줄 요약
  fullText: string | null;
  penalty: string | null;
  keywords: string[]; // 키워드 스캔용
  detectionDifficulty: 'keyword' | 'context' | 'complex';
}

export interface Procedure {
  id: number;
  name: string; // "보톡스"
  specialty: string; // "성형외과"
  aliases: string[]; // ["보툴리눔", "보툴렉스"]
  requiredDisclosures: string[];
  commonViolations: string[];
  specialRegulations: string[];
}

export type RelationType =
  | 'prohibits'
  | 'relatedCase'
  | 'appliesTo'
  | 'requiredDisclosure'
  | 'commonViolation'
  | 'hasSpecialRegulation'
  | 'similarTo'
  | 'parentOf';

export interface Relation {
  id: number;
  sourceType: 'article' | 'procedure' | 'chunk' | 'keyword';
  sourceId: number;
  relationType: RelationType;
  targetType: 'article' | 'procedure' | 'chunk' | 'keyword';
  targetId: number;
  weight: number; // Phase 2 확장용
  metadata: Record<string, unknown>;
}

export interface RelationPath {
  path: string; // "제56조 제2항 제2호 → relatedCase → [사례 요약]"
  relationType: RelationType;
}

export interface RelatedChunk {
  chunkId: number;
  content: string;
  metadata: Record<string, unknown>;
  relationType: RelationType;
  relationSource: string;
}

export interface EnrichedContext {
  originalResultIds: number[];
  relatedChunks: RelatedChunk[];
  procedureInfo: Procedure | null;
  relationPaths: RelationPath[];
}
