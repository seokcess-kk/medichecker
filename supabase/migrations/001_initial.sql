-- MediChecker DB Schema
-- SPEC.md v3.0 기준
-- 테이블 4개 + 함수 3개 + 인덱스

-- ============================================
-- 확장 활성화
-- ============================================
create extension if not exists vector;
create extension if not exists pg_trgm;

-- ============================================
-- 1) 법조항 테이블 (온톨로지 노드)
-- ============================================
create table law_articles (
  id serial primary key,
  article text not null,            -- "제56조"
  clause text,                      -- "제2항"
  subclause text,                   -- "제2호"
  title text not null,              -- "치료경험담"
  summary text not null,            -- 금지 행위 1줄 요약
  full_text text,                   -- 조항 원문
  penalty text,                     -- 벌칙
  keywords text[] default '{}',     -- 관련 키워드 (1단계 스캔용)
  detection_difficulty text         -- 'keyword' | 'context' | 'complex'
    check (detection_difficulty in ('keyword', 'context', 'complex')),
  created_at timestamptz default now()
);

-- ============================================
-- 2) 시술 테이블 (온톨로지 노드)
-- ============================================
create table procedures (
  id serial primary key,
  name text not null,               -- "보톡스"
  specialty text not null,          -- "성형외과"
  aliases text[] default '{}',      -- ["보툴리눔", "보툴렉스"]
  required_disclosures text[],      -- 필수 고지 부작용
  common_violations text[],         -- 흔한 위반 유형
  special_regulations text[],       -- 특별 규제사항
  created_at timestamptz default now()
);

-- ============================================
-- 3) 관계 테이블 (온톨로지 엣지)
-- ============================================
create table relations (
  id serial primary key,
  source_type text not null,        -- 'article' | 'procedure' | 'chunk' | 'keyword'
  source_id int not null,
  relation_type text not null,      -- 관계 유형 (아래 참조)
  target_type text not null,
  target_id int not null,
  weight float default 1.0,         -- 관계 강도 (Phase 2 확장용)
  metadata jsonb default '{}',      -- 추가 정보
  created_at timestamptz default now()
);

-- 관계 유형 (relation_type) 목록:
-- 'prohibits'           : 조항이 금지하는 행위
-- 'relatedCase'         : 조항에 관련된 위반 사례
-- 'appliesTo'           : 조항이 적용되는 매체/상황
-- 'requiredDisclosure'  : 시술에 필수인 고지사항
-- 'commonViolation'     : 시술에서 흔한 위반
-- 'hasSpecialRegulation': 시술/진료과목의 특별 규제
-- 'similarTo'           : 유사 조항/사례 간 연결
-- 'parentOf'            : 상위-하위 조항 관계

-- 관계 조회 인덱스
create index idx_relations_source on relations(source_type, source_id);
create index idx_relations_target on relations(target_type, target_id);
create index idx_relations_type on relations(relation_type);

-- ============================================
-- 4) 청크 테이블 (RAG 데이터 + 온톨로지 연결)
-- ============================================
create table chunks (
  id bigserial primary key,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}',
  article_id int references law_articles(id),   -- 온톨로지 연결
  procedure_id int references procedures(id),   -- 온톨로지 연결
  created_at timestamptz default now()
);

-- 벡터 검색 인덱스
create index idx_chunks_embedding on chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 20);

-- trigram 검색 인덱스
create index idx_chunks_content_trgm on chunks
  using gin (content gin_trgm_ops);

-- ============================================
-- 5) 시맨틱 검색 함수
-- ============================================
create or replace function search_similar_chunks(
  query_embedding vector(1536),
  match_count int default 10,
  filter_specialty text default null,
  filter_ad_type text default null
)
returns table (
  id bigint, content text, metadata jsonb,
  article_id int, procedure_id int, similarity float
)
language plpgsql as $$
begin
  return query
  select c.id, c.content, c.metadata,
    c.article_id, c.procedure_id,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where (filter_specialty is null or c.metadata->>'specialty' = filter_specialty)
    and (filter_ad_type is null or c.metadata->>'ad_type' = filter_ad_type)
  order by c.embedding <=> query_embedding
  limit match_count;
end; $$;

-- ============================================
-- 6) 키워드 검색 함수 (pg_trgm)
-- ============================================
create or replace function search_keyword_chunks(
  query_text text,
  match_count int default 10
)
returns table (
  id bigint, content text, metadata jsonb,
  article_id int, procedure_id int, similarity float
)
language plpgsql as $$
begin
  return query
  select c.id, c.content, c.metadata,
    c.article_id, c.procedure_id,
    similarity(c.content, query_text) as sim
  from chunks c
  where c.content % query_text
  order by c.content <-> query_text
  limit match_count;
end; $$;

-- ============================================
-- 7) 관계 기반 컨텍스트 확장 함수 (경량 온톨로지 핵심)
-- ============================================
create or replace function get_related_context(
  input_article_ids int[],
  input_procedure_ids int[]
)
returns table (
  chunk_id bigint,
  chunk_content text,
  chunk_metadata jsonb,
  relation_type text,
  relation_source text
)
language plpgsql as $$
begin
  return query
  -- 조항에 연결된 관련 사례/규제 (1홉)
  select c.id, c.content, c.metadata,
    r.relation_type,
    'article_relation' as relation_source
  from relations r
  join chunks c on (r.target_type = 'chunk' and r.target_id = c.id::int)
  where r.source_type = 'article'
    and r.source_id = any(input_article_ids)
    and r.relation_type in ('relatedCase', 'prohibits', 'appliesTo')

  union all

  -- 시술에 연결된 관련 사례/규제 (1홉)
  select c.id, c.content, c.metadata,
    r.relation_type,
    'procedure_relation' as relation_source
  from relations r
  join chunks c on (r.target_type = 'chunk' and r.target_id = c.id::int)
  where r.source_type = 'procedure'
    and r.source_id = any(input_procedure_ids)
    and r.relation_type in ('commonViolation', 'requiredDisclosure', 'hasSpecialRegulation')

  union all

  -- 시술의 필수 고지사항 (procedures 테이블 직접)
  select 0 as chunk_id,
    'required_disclosure: ' || array_to_string(p.required_disclosures, ', '),
    jsonb_build_object('type', 'disclosure', 'procedure', p.name),
    'requiredDisclosure',
    'procedure_direct'
  from procedures p
  where p.id = any(input_procedure_ids)
    and p.required_disclosures is not null;
end; $$;
