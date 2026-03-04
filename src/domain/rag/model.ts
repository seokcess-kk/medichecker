/**
 * RAG Domain - Model
 * 검색 관련 타입 정의
 */

export interface Chunk {
  id: number;
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
  articleId: number | null;
  procedureId: number | null;
}

export interface ChunkMetadata {
  source: 'law' | 'guideline' | 'case';
  article?: string;
  specialty?: string;
  adType?: string;
  year?: number;
}

export interface SearchResult {
  chunk: Chunk;
  similarity: number;
  searchType: 'semantic' | 'keyword' | 'hybrid';
}

export interface SearchQuery {
  text: string;
  embedding?: number[];
  filters?: {
    specialty?: string;
    adType?: string;
  };
  limit?: number;
}

export interface HybridSearchConfig {
  semanticWeight: number; // 기본 0.6
  keywordWeight: number; // 기본 0.4
  topK: number; // 기본 10
}
