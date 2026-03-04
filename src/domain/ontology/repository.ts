/**
 * Ontology Domain - Repository
 * 온톨로지 테이블 DB 접근
 */

import { createClient } from '@/lib/supabase/client';
import type { LawArticle, Procedure, Relation, RelatedChunk } from './model';

// DB Row 타입 정의
interface LawArticleRow {
  id: number;
  article: string;
  clause: string | null;
  subclause: string | null;
  title: string;
  summary: string;
  full_text: string | null;
  penalty: string | null;
  keywords: string[];
  detection_difficulty: 'keyword' | 'context' | 'complex';
}

interface ProcedureRow {
  id: number;
  name: string;
  specialty: string;
  aliases: string[];
  required_disclosures: string[] | null;
  common_violations: string[] | null;
  special_regulations: string[] | null;
}

interface RelatedContextRow {
  chunk_id: number;
  chunk_content: string;
  chunk_metadata: Record<string, unknown>;
  relation_type: string;
  relation_source: string;
}

interface RelationRow {
  id: number;
  source_type: 'article' | 'procedure' | 'chunk' | 'keyword';
  source_id: number;
  relation_type: string;
  target_type: 'article' | 'procedure' | 'chunk' | 'keyword';
  target_id: number;
  weight: number | null;
  metadata: Record<string, unknown> | null;
}

export class OntologyRepository {
  /**
   * 모든 법조항 + 키워드 조회 (1단계 스캔용)
   */
  async getAllArticlesWithKeywords(): Promise<LawArticle[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('law_articles')
      .select('*')
      .order('id');

    if (error) throw error;

    return ((data ?? []) as LawArticleRow[]).map((row) => ({
      id: row.id,
      article: row.article,
      clause: row.clause,
      subclause: row.subclause,
      title: row.title,
      summary: row.summary,
      fullText: row.full_text,
      penalty: row.penalty,
      keywords: row.keywords ?? [],
      detectionDifficulty: row.detection_difficulty,
    }));
  }

  /**
   * 시술명으로 시술 찾기 (별칭 포함)
   */
  async findProcedure(
    name: string,
    specialty?: string
  ): Promise<Procedure | null> {
    const supabase = createClient();

    let query = supabase
      .from('procedures')
      .select('*')
      .or(`name.ilike.%${name}%,aliases.cs.{${name}}`);

    if (specialty) {
      query = query.eq('specialty', specialty);
    }

    const { data, error } = await query.limit(1).single();

    if (error) return null;

    const row = data as ProcedureRow;
    return {
      id: row.id,
      name: row.name,
      specialty: row.specialty,
      aliases: row.aliases ?? [],
      requiredDisclosures: row.required_disclosures ?? [],
      commonViolations: row.common_violations ?? [],
      specialRegulations: row.special_regulations ?? [],
    };
  }

  /**
   * 시술 ID로 조회
   */
  async findProcedureById(id: number): Promise<Procedure | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    const row = data as ProcedureRow;
    return {
      id: row.id,
      name: row.name,
      specialty: row.specialty,
      aliases: row.aliases ?? [],
      requiredDisclosures: row.required_disclosures ?? [],
      commonViolations: row.common_violations ?? [],
      specialRegulations: row.special_regulations ?? [],
    };
  }

  /**
   * 관계 기반 컨텍스트 확장 (1홉 탐색)
   */
  async getRelatedContext(
    articleIds: number[],
    procedureIds: number[]
  ): Promise<RelatedChunk[]> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_related_context', {
      input_article_ids: articleIds,
      input_procedure_ids: procedureIds,
    } as unknown as undefined);

    if (error) throw error;

    return ((data ?? []) as RelatedContextRow[]).map((row) => ({
      chunkId: row.chunk_id,
      content: row.chunk_content,
      metadata: row.chunk_metadata,
      relationType: row.relation_type as RelatedChunk['relationType'],
      relationSource: row.relation_source,
    }));
  }

  /**
   * 모든 법조항 조회 (테스트용)
   */
  async getAllLawArticles(): Promise<LawArticle[]> {
    return this.getAllArticlesWithKeywords();
  }

  /**
   * 모든 시술 조회 (테스트용)
   */
  async getAllProcedures(): Promise<Procedure[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .order('id');

    if (error) throw error;

    return ((data ?? []) as ProcedureRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      specialty: row.specialty,
      aliases: row.aliases ?? [],
      requiredDisclosures: row.required_disclosures ?? [],
      commonViolations: row.common_violations ?? [],
      specialRegulations: row.special_regulations ?? [],
    }));
  }

  /**
   * 모든 관계 조회 (테스트용)
   */
  async getAllRelations(): Promise<Relation[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('relations')
      .select('*')
      .order('id');

    if (error) throw error;

    return ((data ?? []) as RelationRow[]).map((row) => ({
      id: row.id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      relationType: row.relation_type as Relation['relationType'],
      targetType: row.target_type,
      targetId: row.target_id,
      weight: row.weight ?? 1,
      metadata: row.metadata ?? {},
    }));
  }
}

export const ontologyRepository = new OntologyRepository();
