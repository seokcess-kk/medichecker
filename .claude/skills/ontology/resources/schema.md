# 온톨로지 DB 스키마 상세

## 테이블 구조

### law_articles (조항 노드)

```sql
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
```

### procedures (시술 노드)

```sql
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
```

### relations (관계 엣지)

```sql
create table relations (
  id serial primary key,
  source_type text not null,        -- 'article' | 'procedure' | 'chunk' | 'keyword'
  source_id int not null,
  relation_type text not null,      -- 관계 유형 (relation-types.md 참조)
  target_type text not null,
  target_id int not null,
  weight float default 1.0,         -- 관계 강도 (Phase 2 확장용)
  metadata jsonb default '{}',      -- 추가 정보
  created_at timestamptz default now()
);
```

### chunks (RAG 청크 + 온톨로지 연결)

```sql
create table chunks (
  id bigserial primary key,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}',
  article_id int references law_articles(id),   -- 온톨로지 연결
  procedure_id int references procedures(id),   -- 온톨로지 연결
  created_at timestamptz default now()
);
```

## 인덱스

```sql
-- 관계 조회
create index idx_relations_source on relations(source_type, source_id);
create index idx_relations_target on relations(target_type, target_id);
create index idx_relations_type on relations(relation_type);

-- 벡터 검색
create index idx_chunks_embedding on chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 20);

-- 키워드 검색
create index idx_chunks_content_trgm on chunks
  using gin (content gin_trgm_ops);
```

## 데이터 규모 (MVP)

| 테이블 | 예상 행 수 |
|--------|-----------|
| law_articles | 15 |
| procedures | 50 |
| relations | ~1,000 |
| chunks | ~550 |
