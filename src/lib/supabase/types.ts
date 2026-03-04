/**
 * Supabase Database Types
 * Generated from SPEC.md 1.3 DB 스키마
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      law_articles: {
        Row: {
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
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['law_articles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['law_articles']['Insert']>;
      };
      procedures: {
        Row: {
          id: number;
          name: string;
          specialty: string;
          aliases: string[];
          required_disclosures: string[] | null;
          common_violations: string[] | null;
          special_regulations: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['procedures']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['procedures']['Insert']>;
      };
      relations: {
        Row: {
          id: number;
          source_type: string;
          source_id: number;
          relation_type: string;
          target_type: string;
          target_id: number;
          weight: number;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['relations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['relations']['Insert']>;
      };
      chunks: {
        Row: {
          id: number;
          content: string;
          embedding: number[] | null;
          metadata: Json;
          article_id: number | null;
          procedure_id: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chunks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['chunks']['Insert']>;
      };
    };
    Functions: {
      search_similar_chunks: {
        Args: {
          query_embedding: number[];
          match_count: number;
          filter_specialty: string | null;
          filter_ad_type: string | null;
        };
        Returns: {
          id: number;
          content: string;
          metadata: Json;
          article_id: number | null;
          procedure_id: number | null;
          similarity: number;
        }[];
      };
      search_keyword_chunks: {
        Args: {
          query_text: string;
          match_count: number;
        };
        Returns: {
          id: number;
          content: string;
          metadata: Json;
          article_id: number | null;
          procedure_id: number | null;
          similarity: number;
        }[];
      };
      get_related_context: {
        Args: {
          input_article_ids: number[];
          input_procedure_ids: number[];
        };
        Returns: {
          chunk_id: number;
          chunk_content: string;
          chunk_metadata: Json;
          relation_type: string;
          relation_source: string;
        }[];
      };
    };
  };
}
