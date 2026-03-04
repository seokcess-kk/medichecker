/**
 * RAG Domain - Repository
 * 청크 검색 DB 접근
 */

import { createClient } from '@/lib/supabase/client';
import type { Chunk, SearchResult } from './model';

// DB Row 타입 정의
interface SearchResultRow {
  id: number;
  content: string;
  metadata: Chunk['metadata'];
  article_id: number | null;
  procedure_id: number | null;
  similarity: number;
}

interface ChunkRow {
  id: number;
  content: string;
  metadata: Chunk['metadata'];
  article_id: number | null;
  procedure_id: number | null;
}

export class RagRepository {
  /**
   * 시맨틱 검색 (pgvector)
   */
  async searchSemantic(
    embedding: number[],
    limit: number = 10,
    filters?: { specialty?: string; adType?: string }
  ): Promise<SearchResult[]> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('search_similar_chunks', {
      query_embedding: embedding,
      match_count: limit,
      filter_specialty: filters?.specialty ?? null,
      filter_ad_type: filters?.adType ?? null,
    } as unknown as undefined);

    if (error) throw error;

    return ((data ?? []) as SearchResultRow[]).map((row) => ({
      chunk: {
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        articleId: row.article_id,
        procedureId: row.procedure_id,
      },
      similarity: row.similarity,
      searchType: 'semantic' as const,
    }));
  }

  /**
   * 키워드 검색 (pg_trgm)
   */
  async searchKeyword(
    queryText: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('search_keyword_chunks', {
      query_text: queryText,
      match_count: limit,
    } as unknown as undefined);

    if (error) throw error;

    return ((data ?? []) as SearchResultRow[]).map((row) => ({
      chunk: {
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        articleId: row.article_id,
        procedureId: row.procedure_id,
      },
      similarity: row.similarity,
      searchType: 'keyword' as const,
    }));
  }

  /**
   * 청크 ID로 조회
   */
  async findById(id: number): Promise<Chunk | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('chunks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    const row = data as ChunkRow;
    return {
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      articleId: row.article_id,
      procedureId: row.procedure_id,
    };
  }
}

export const ragRepository = new RagRepository();
