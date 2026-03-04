# MediChecker — 의료광고법 AI 준수 검증 플랫폼

> Version 3.0 | 2026.03
> SDD 기반 개발 Spec + Claude Code 인프라 설계
> 정확도 우선 · 경량 온톨로지 · 병렬 개발 · Claude Code 완결형

---

# Part 1: 프로덕트 Spec (Phase 0)

## 1.1 개요

### 목적

병의원 및 의료광고 대행사가 블로그/SNS 광고 텍스트를 발행 전, 의료법 제56조 기준 위반 여부를 AI로 자동 검증하고 수정 가이드를 제공하는 사전검증 도구.

### 범위

**MVP 포함:**

- 광고 텍스트 입력 (붙여넣기/직접 입력)
- 광고 유형 선택 (블로그/인스타그램/유튜브/기타)
- 7단계 RAG 파이프라인 검증 (경량 온톨로지 포함)
- 결과 화면: 위험도 점수 + 위반 하이라이트 + 법령 근거 + 확신도 + 수정 가이드
- 단계별 진행 표시 UI (SSE)

**MVP 제외 (Next Steps):**

- 회원가입/인증/결제
- 검증 이력 저장, PDF 보고서
- API 제공, 경쟁사 모니터링
- 본격 Graph RAG (다중 홉 탐색, 서브그래프 추출)

### 성공 기준

| 지표 | 기준 | 측정 방법 |
|------|------|----------|
| 검증 정확도 | F1-score ≥ 0.85 | 테스트 데이터셋 60건 |
| 오탐률 (FP) | ≤ 15% | 비위반 20건 중 오탐 수 |
| 미탐률 (FN) | ≤ 10% | 위반 30건 중 미탐 수 |
| 응답 시간 | 전체 ≤ 10초 | 1500자 블로그 기준 |
| RAG 검색 적합도 | Hit Rate ≥ 80% | 쿼리 대비 관련 청크 반환율 |
| 온톨로지 활용도 | 관계 확장 기여율 ≥ 30% | 관계 확장으로 추가된 컨텍스트가 최종 판단에 기여한 비율 |

---

## 1.2 기술 스택

| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| Frontend | Next.js | 15 (App Router) | React 19, RSC |
| 스타일링 | Tailwind CSS | 4.x | 유틸리티 퍼스트 |
| Backend | Next.js API Routes | - | Route Handlers (app/api/) |
| AI (검증) | Claude API (Sonnet) | claude-sonnet-4-5-20250929 | 5~6단계 판단용 |
| AI (분류) | Claude API (Haiku) | claude-haiku-4-5-20251001 | 2~3단계 경량 처리 |
| 임베딩 | OpenAI Embeddings | text-embedding-3-small | 1536차원 |
| DB | Supabase (PostgreSQL) | 15+ | pgvector + pg_trgm |
| 벡터 검색 | pgvector | 0.7+ | 시맨틱 검색 |
| 키워드 검색 | pg_trgm | - | trigram 유사 매칭 |
| 온톨로지 | PostgreSQL 관계형 테이블 | - | 경량 그래프 (FK 기반) |
| 배포 | Vercel | - | Next.js 최적화 |
| 패키지 매니저 | pnpm | 9+ | 단일 앱 |
| 언어 | TypeScript | 5.5+ | strict 모드 필수 |

> **⚠️ 한국어 FTS:** Supabase 클라우드에서 한국어 형태소 분석기 설치 불가. `to_tsvector('korean')` 대신 `pg_trgm`의 `similarity()` 사용.
>
> **온톨로지 선택:** 별도 그래프 DB(Neo4j 등) 없이 PostgreSQL 관계형 테이블로 구현. MVP 규모(노드 수백, 엣지 수천)에서 SQL JOIN으로 1~2홉 탐색 충분. Phase 2에서 본격 Graph RAG 도입 시 Neo4j 또는 재귀 쿼리로 확장.

### 주요 패키지

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "openai": "^4.60.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^4.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0"
  }
}
```

---

## 1.3 아키텍처

### DB 스키마 설계

#### 핵심 테이블 구조

```
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL (Supabase)                  │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │ law_articles  │    │  procedures  │    │  chunks   │  │
│  │──────────────│    │──────────────│    │───────────│  │
│  │ id           │◄──┐│ id           │◄──┐│ id        │  │
│  │ article      │   ││ name         │   ││ content   │  │
│  │ clause       │   ││ specialty    │   ││ embedding │  │
│  │ subclause    │   ││ required_    │   ││ metadata  │  │
│  │ title        │   ││   disclosures│   ││ article_id│──┘
│  │ summary      │   ││ common_      │   ││ procedure │──┘
│  │ penalty      │   ││   violations │   ││   _id     │  │
│  │ keywords[]   │   │└──────────────┘   │└───────────┘  │
│  └──────────────┘   │                   │               │
│         ▲           │                   │               │
│         │           │                   │               │
│  ┌──────┴───────────┴───────────────────┘               │
│  │         relations (그래프 엣지)                        │
│  │──────────────────────────────────                     │
│  │ id, source_type, source_id,                           │
│  │ relation_type, target_type, target_id                 │
│  └───────────────────────────────────                    │
└─────────────────────────────────────────────────────────┘
```

#### SQL 마이그레이션 (001_initial.sql)

```sql
-- 확장 활성화
create extension if not exists vector;
create extension if not exists pg_trgm;

-- 1) 법조항 테이블 (온톨로지 노드)
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

-- 2) 시술 테이블 (온톨로지 노드)
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

-- 3) 관계 테이블 (온톨로지 엣지)
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

-- 4) 청크 테이블 (RAG 데이터 + 온톨로지 연결)
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

-- 5) 시맨틱 검색 함수
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

-- 6) 키워드 검색 함수 (pg_trgm)
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

-- 7) 관계 기반 컨텍스트 확장 함수 (경량 온톨로지 핵심)
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
```

### 디렉토리 구조

```
medichecker/
├── CLAUDE.md
├── .claude/
│   ├── settings.json
│   ├── skills/
│   │   ├── skill-rules.json
│   │   ├── medical-law/
│   │   │   ├── SKILL.md
│   │   │   └── resources/
│   │   │       ├── law-article-56.md
│   │   │       ├── violation-types.md
│   │   │       └── examples.md
│   │   ├── rag-pipeline/
│   │   │   ├── SKILL.md
│   │   │   └── resources/
│   │   │       ├── chunking.md
│   │   │       └── search.md
│   │   ├── ontology/                          # [v3 추가]
│   │   │   ├── SKILL.md
│   │   │   └── resources/
│   │   │       ├── schema.md
│   │   │       ├── relation-types.md
│   │   │       └── graph-rag-expansion.md     # Phase 2 확장 가이드
│   │   ├── nextjs-guidelines/
│   │   │   ├── SKILL.md
│   │   │   └── resources/
│   │   ├── ui-design/
│   │   │   └── SKILL.md
│   │   ├── legal-data-analysis/
│   │   │   ├── SKILL.md
│   │   │   └── resources/
│   │   │       ├── analysis-checklist.md
│   │   │       └── output-template.md
│   │   ├── legal-data-processing/
│   │   │   ├── SKILL.md
│   │   │   └── resources/
│   │   │       ├── chunking-rules.md
│   │   │       ├── metadata-schema.md
│   │   │       └── ontology-construction.md   # [v3 추가]
│   │   └── eval-dataset/
│   │       ├── SKILL.md
│   │       └── resources/
│   │           └── labeling-guide.md
│   ├── agents/
│   │   ├── planner.md
│   │   ├── plan-reviewer.md
│   │   ├── code-architecture-reviewer.md
│   │   ├── auto-error-resolver.md
│   │   ├── rag-accuracy-tester.md
│   │   └── case-curator.md
│   └── hooks/
│       ├── skill-activation-prompt.sh
│       └── post-tool-use-tracker.sh
├── dev/
│   └── active/mvp/
│       ├── mvp-plan.md
│       ├── mvp-context.md
│       └── mvp-tasks.md
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── verify/route.ts
│   │       └── embed/route.ts
│   ├── domain/
│   │   ├── verification/
│   │   │   ├── model.ts
│   │   │   ├── service.ts                    # 7단계 파이프라인 오케스트레이션
│   │   │   └── repository.ts
│   │   ├── rag/
│   │   │   ├── model.ts
│   │   │   ├── service.ts                    # Hybrid Search + 관계 확장
│   │   │   └── repository.ts
│   │   ├── ontology/                          # [v3 추가] 온톨로지 도메인
│   │   │   ├── model.ts                      # 조항, 시술, 관계 타입
│   │   │   ├── service.ts                    # 관계 기반 컨텍스트 확장
│   │   │   └── repository.ts                 # 온톨로지 DB 접근
│   │   └── analysis/
│   │       ├── model.ts
│   │       ├── service.ts
│   │       └── repository.ts
│   ├── lib/
│   │   ├── claude.ts
│   │   ├── embedding.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   └── prompts/
│   │       ├── system-prompt.ts
│   │       ├── classification.ts
│   │       ├── query-rewrite.ts
│   │       ├── judgment.ts
│   │       └── verification.ts
│   ├── components/
│   │   ├── TextInput.tsx
│   │   ├── AdTypeSelector.tsx
│   │   ├── VerifyButton.tsx
│   │   ├── ResultPanel.tsx
│   │   ├── RiskScore.tsx
│   │   ├── ViolationHighlight.tsx
│   │   ├── ViolationItem.tsx
│   │   └── ProgressIndicator.tsx
│   └── data/
│       ├── keywords.ts
│       └── seed/
│           ├── law-chunks.json
│           ├── guidelines-chunks.json
│           ├── cases-chunks.json
│           ├── law-articles.json              # [v3 추가]
│           ├── procedures.json                # [v3 추가]
│           └── relations.json                 # [v3 추가]
├── scripts/
│   ├── seed-vectors.ts
│   ├── seed-ontology.ts                       # [v3 추가]
│   └── eval/
│       ├── test-dataset.json
│       ├── run-eval.ts
│       └── search-quality-test.ts
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
└── tests/
    ├── pipeline.test.ts
    └── ontology.test.ts                       # [v3 추가]
```

### 데이터 흐름

```
[사용자 브라우저]
    ↓ POST /api/verify (텍스트 + 광고유형)
    ↓ SSE 연결
[Verification Service: 7단계 오케스트레이션]
    ├→ [1] Analysis: 키워드 스캔 (로컬)
    ├→ [2] Claude Haiku: 컨텍스트 분류
    ├→ [3] Claude Haiku: Query Rewriting
    ├→ [4] RAG: Hybrid Search (pgvector + pg_trgm)
    ├→ [4.5] Ontology: 관계 기반 컨텍스트 확장 ← 🆕
    ├→ [5] Claude Sonnet: 위반 판단
    └→ [6] Claude Sonnet: Self-Verification
    ↓ SSE: 단계 진행 상태 → 최종 JSON
[사용자 브라우저: 진행 표시 → 결과 렌더링]
```

---

## 1.4 RAG 파이프라인 7단계 상세 설계

### 설계 원칙

1. **정확도 우선:** 단계별 역할 집중, 속도 트레이드오프 허용.
2. **근거 기반 판단:** RAG + 온톨로지 근거 없으면 위반 판단 금지.
3. **확신도 투명성:** 0~100% 확신도 + 판단 근거 경로 표시.
4. **확장 가능 설계:** 경량 온톨로지 → Phase 2 본격 Graph RAG로 전환 가능.

### [1단계] 규칙 기반 키워드 스캔

**처리:** 정규식 패턴 매칭 (AI 호출 없음) | **시간:** ~50ms

**패턴은 온톨로지의 `law_articles.keywords[]`에서 동적 로드:**

```typescript
// 1단계: 키워드를 하드코딩하지 않고 DB에서 가져옴
const articles = await ontologyRepo.getAllArticlesWithKeywords();
const patterns = articles.flatMap(a =>
  a.keywords.map(k => ({
    pattern: new RegExp(k, 'gi'),
    articleId: a.id,
    article: `${a.article} ${a.clause} ${a.subclause}`,
    category: a.title
  }))
);
```

> **⚠️ 키워드 패턴은 Phase 0.5 법령 분석에서 확정되어 `law_articles` 테이블에 적재됨.**

**출력 타입:**

```typescript
interface KeywordScanResult {
  matches: {
    keyword: string;
    position: [number, number];
    articleId: number;         // 온톨로지 연결
    article: string;
    category: string;
    confidence: 1.0;
  }[];
}
```

### [2단계] 컨텍스트 분류 (Claude Haiku)

**모델:** Haiku | **시간:** ~1초

**추출:** 진료과목, 시술명, 광고 유형, 핵심 주장 리스트

**온톨로지 연동:** 시술명 추출 후, `procedures` 테이블에서 매칭하여 `procedure_id`를 확보. 이후 4.5단계에서 활용.

```typescript
// 2단계 후처리: 시술명 → procedure_id 매핑
const procedureMatch = await ontologyRepo.findProcedure(
  classification.procedure,
  classification.specialty
);
// aliases 필드도 검색 (보톡스 = 보툴리눔 = 보툴렉스)
```

> **병합 가능성:** 2단계(분류)와 3단계(쿼리변환)는 초기에 분리, 테스트 후 병합 가능. 프롬프트 파일은 분리 유지하되 service에서 설정값으로 병합/분리 제어.

### [3단계] Query Rewriting (Claude Haiku)

**모델:** Haiku | **시간:** ~1초

**목적:** 광고 표현 → 법률 검색어 변환. 2단계 분류 결과 활용.

### [4단계] Hybrid Search (pgvector + pg_trgm)

**시간:** ~300ms

| 방식 | 엔진 | RRF 가중치 |
|------|------|-----------|
| 시맨틱 | pgvector | 0.6 |
| 키워드 | pg_trgm | 0.4 |
| 메타데이터 | WHERE 절 | 필터 |

**반환:** Top-10 청크 (법령 + 사례 + 해설서 혼합). 각 청크에 `article_id`, `procedure_id`가 연결되어 있어 다음 단계에서 활용.

### [4.5단계] 관계 기반 컨텍스트 확장 🆕

**처리:** SQL 함수 호출 (AI 호출 없음) | **시간:** ~100ms

**이 단계가 경량 온톨로지의 핵심입니다.** 4단계 벡터 검색 결과에서 `article_id`와 `procedure_id`를 추출하고, `relations` 테이블을 통해 연결된 추가 컨텍스트를 수집합니다.

```typescript
// src/domain/ontology/service.ts
export class OntologyService {
  async enrichContext(
    searchResults: SearchResult[],
    procedureId: number | null
  ): Promise<EnrichedContext> {

    // 4단계 결과에서 article_id, procedure_id 수집
    const articleIds = [...new Set(
      searchResults.map(r => r.chunk.articleId).filter(Boolean)
    )];
    const procedureIds = procedureId
      ? [procedureId]
      : [...new Set(
          searchResults.map(r => r.chunk.procedureId).filter(Boolean)
        )];

    // 관계 기반 확장 (1홉 탐색)
    const relatedContext = await this.repository.getRelatedContext(
      articleIds,
      procedureIds
    );

    // 시술 특화 정보 (필수 고지사항, 흔한 위반)
    const procedureInfo = procedureIds.length > 0
      ? await this.repository.getProcedureDetails(procedureIds)
      : null;

    // 중복 제거 (이미 4단계에서 검색된 청크 제외)
    const existingIds = new Set(searchResults.map(r => r.chunk.id));
    const newContext = relatedContext.filter(c => !existingIds.has(c.chunkId));

    return {
      originalResults: searchResults,
      relatedChunks: newContext,
      procedureInfo,
      relationPaths: this.buildRelationPaths(articleIds, relatedContext)
    };
  }

  // 판단 근거 경로 생성 (5단계에 전달)
  private buildRelationPaths(articleIds, relatedContext) {
    // "제56조 제2항 제2호 → relatedCase → [2024 A피부과 적발]"
    // 이 경로를 Sonnet에게 제공하면 판단 근거가 명확해짐
    return relatedContext.map(c => ({
      path: `${c.sourceArticle} → ${c.relationType} → ${c.targetSummary}`,
      relationType: c.relationType
    }));
  }
}
```

**왜 이 단계가 정확도를 올리는가:**

| 상황 | 4단계만 있을 때 | 4.5단계 추가 시 |
|------|----------------|----------------|
| "보톡스 시술 후 주름 사라짐" | 벡터 유사 사례 5건 반환 (관련 없는 것 섞임) | + 보톡스 필수 부작용 고지 + 성형외과 특별 규제 + 보톡스 관련 적발 사례 |
| 복합 위반 (경험담 + 과장) | 제2호 관련 청크만 검색될 수 있음 | + 제2호 → 제3호 연결 관계로 과장 관련 조항도 자동 수집 |
| 할인 이벤트 광고 | 할인 관련 사례 검색 | + 해당 시술의 필수 고지사항 누락 여부 체크 가능 |

### [5단계] 위반 판단 (Claude Sonnet)

**모델:** Sonnet | **시간:** ~4초

**v3 변경: 4.5단계의 관계 경로를 입력에 포함**

```
## 검색 결과 (벡터 검색)
{4단계 결과}

## 관계 기반 추가 컨텍스트 (온톨로지)
{4.5단계 결과: 관련 사례, 시술 특화 정보, 필수 고지사항}

## 판단 근거 경로
{4.5단계 relationPaths: "제56조 제2항 제2호 → relatedCase → ..." }

## 시술 특화 정보
{procedures 테이블: 필수 부작용 고지 항목, 특별 규제}
```

이렇게 하면 Sonnet이 **왜 이 조항이 적용되는지의 논리적 경로**를 함께 받으므로, 판단의 정확도와 근거의 구체성이 향상됩니다.

**나머지 프롬프트 구조 (v2와 동일):** 근거 필수, 확신도 0~100, 위반 표현 + 누락 정보 이중 체크.

### [6단계] Self-Verification (Claude Sonnet)

**모델:** Sonnet | **시간:** ~3초

v2와 동일. 5단계 결과의 오탐 제거 + 미탐 재확인.

### 소요 시간 및 비용

| 단계 | 모델 | 시간 | 비용/건 |
|------|------|------|---------|
| 1 키워드 스캔 | 로컬 | ~50ms | $0 |
| 2 분류 | Haiku | ~1초 | ~$0.0001 |
| 3 쿼리변환 | Haiku | ~1초 | ~$0.0001 |
| 4 검색 | Supabase | ~300ms | $0 |
| **4.5 관계 확장** | **Supabase** | **~100ms** | **$0** |
| 5 판단 | Sonnet | ~4초 | ~$0.013 |
| 6 검증 | Sonnet | ~3초 | ~$0.015 |
| **합계** | | **~8-10초** | **~$0.028 (~36원)** |

> 4.5단계는 SQL 함수 호출이므로 시간/비용 추가가 거의 없음. 5단계 입력 토큰이 약간 증가(관계 컨텍스트 추가분 ~500토큰)하여 비용 $0.001 미만 증가.

**개발/테스트 비용 예산:** 프롬프트 튜닝 500~1000회 → ~$15~30 (2~4만원)

---

## 1.5 데이터 소스 및 구축 전략

### 데이터 계층

| Layer | 소스 | 저장 위치 | 예상 규모 |
|-------|------|----------|----------|
| 1 | 의료법 제56조, 시행령 | law_articles + chunks | ~15 노드 + ~50 청크 |
| 2 | 보건복지부 해설서 | chunks + relations | ~200 청크 + ~300 엣지 |
| 3 | 적발 사례, 판례 | chunks + relations | ~300 청크 + ~500 엣지 |
| 4 | 시술 정보 | procedures + relations | ~50 노드 + ~200 엣지 |

**온톨로지 총 규모:** 노드 ~65개 (articles 15 + procedures 50), 엣지 ~1000개, 청크 ~550개

### 청킹 + 온톨로지 동시 구축

**법령 (Layer 1):**

```
의료법 제56조 제2항 제2호 원문
    ↓
[law_articles 테이블] id=1, article="제56조", clause="제2항", subclause="제2호",
                      title="치료경험담", summary="환자 경험담으로 치료효과 오인 유발 금지"
    ↓
[chunks 테이블] content="의료법 제56조 제2항 제2호: ...", article_id=1
    ↓
[relations 테이블]
  - (article, 1) → prohibits → (chunk, 10)  "환자 후기 작성 대행"
  - (article, 1) → prohibits → (chunk, 11)  "전후사진 비교 광고"
  - (article, 1) → appliesTo → (chunk, 12)  "블로그, 인스타그램"
  - (article, 1) → similarTo → (article, 2)  "제3호(과장광고)와 관련"
```

**시술 (Layer 4):**

```
보톡스 시술 정보
    ↓
[procedures 테이블] id=1, name="보톡스", specialty="성형외과",
                    aliases=["보툴리눔", "보툴렉스"],
                    required_disclosures=["멍", "비대칭", "두통"],
                    common_violations=["효과 과장", "경험담"]
    ↓
[relations 테이블]
  - (procedure, 1) → commonViolation → (article, 1)  "제2호: 치료경험담"
  - (procedure, 1) → commonViolation → (article, 2)  "제3호: 과장광고"
  - (procedure, 1) → hasSpecialRegulation → (chunk, 50)  "성형 시술 사전심의 의무"
```

### 임베딩 전략

**모델:** OpenAI `text-embedding-3-small` (1536차원)

**추상화 필수:**

```typescript
export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
export class OpenAIEmbedding implements EmbeddingProvider { ... }
```

**검색 품질 검증:** 시드 적재 후 10건 테스트 쿼리 → Hit Rate ≥ 80% 확인.

---

## 1.6 정확도 측정 체계

### 테스트 데이터셋 (60건)

| 카테고리 | 건수 | 비고 |
|---------|------|------|
| 명확한 위반 | 20 | 키워드/표현 기반 |
| 애매한 위반 | 10 | 맥락 판단 필요 |
| 비위반 (정보제공) | 10 | 심의 통과 |
| 비위반 (일반 광고) | 10 | 법령 준수 |
| 경계 사례 | 10 | 해석 분분 |

### 경계 사례 라벨링 기준

1. 해설서에 유사 사례 있으면 해설서 판단 따름
2. 없으면 보수적 판단 (위반 쪽 라벨링)
3. 라벨에 확신도 기록: `high` / `medium` / `low`. low는 평가 가중치 하향.

### 측정 지표

| 지표 | MVP 기준 | 비고 |
|------|---------|------|
| Precision | ≥ 0.85 | |
| Recall | ≥ 0.90 | 미탐이 오탐보다 위험 |
| F1-score | ≥ 0.85 | |

### 온톨로지 기여도 측정 (v3 추가)

4.5단계의 효과를 측정하기 위해, **온톨로지 없이 돌린 결과 vs 있이 돌린 결과**를 비교합니다.

```typescript
// eval 스크립트에서 A/B 비교
const resultWithOntology = await pipeline.verify(text, { useOntology: true });
const resultWithoutOntology = await pipeline.verify(text, { useOntology: false });
// F1 차이 = 온톨로지 기여도
```

---

## 1.7 단계별 구현 계획 (병렬 3트랙)

### 트랙 구조

```
[Track A: 데이터+온톨로지]  [Track B: 백엔드]        [Track C: 프론트엔드]
         │                        │                         │
   A1: 법령 분석              B1: 프로젝트 셋업           (대기)
         │                        │                         │
   A2: 청킹+온톨로지 구축     B2: DB 스키마+함수             │
         │                        │                         │
   A3: 시드 적재+검증         B3: 1단계 키워드 스캔       C1: UI 컴포넌트
         │                        │                       (Mock)
         └──→ 합류 ──→       B4: 4단계 검색                 │
                              B4.5: 4.5단계 관계확장         │
                                    │                       │
                              B5: 2~3단계 AI 분류            │
                                    │                       │
                              B6: 5~6단계 판단+검증          │
                                    │                       │
                              B7: API 엔드포인트 ←── C2: API 연동
                                    │                       │
                              ──── 통합 테스트 ──────────────
                                    │
                              정확도 평가 + 튜닝
                                    │
                                  배포
```

### 상세 구현 계획

**Track A: 데이터 + 온톨로지 구축**

| Step | 작업 | 선행 | 산출물 | 검증 |
|------|------|------|--------|------|
| A1 | 법령 분석 | 법령 파일 | 키워드 리스트, 15호 분류, 프롬프트 기준, **시술-조항 관계 매핑** | `legal-data-analysis` 스킬 참조 |
| A2 | 청킹 + 온톨로지 데이터 구축 | A1 | law-chunks.json, guidelines-chunks.json, cases-chunks.json, **law-articles.json, procedures.json, relations.json** | `legal-data-processing` 스킬 + `ontology` 스킬 참조 |
| A3 | 시드 적재 + 검색 품질 검증 | A2+B2 | DB 적재, Hit Rate 리포트, **관계 탐색 테스트** | Hit Rate ≥ 80%, 관계 확장 동작 확인 |

**Track B: 백엔드**

| Step | 작업 | 선행 | 산출물 | 검증 |
|------|------|------|--------|------|
| B1 | Next.js 초기화 + Supabase 연결 | 없음 | 스캐폴딩 | `pnpm dev` + DB 연결 |
| B2 | DB 스키마 (chunks + **law_articles + procedures + relations** + pgvector + pg_trgm + 함수 7개) | B1 | 001_initial.sql | 마이그레이션 성공 |
| B3 | 1단계 키워드 스캔 (analysis 도메인) | B1 | 3파일 세트 | 단위 테스트 |
| B4 | 4단계 Hybrid Search (rag 도메인) | B2+A3 | 3파일 세트 | 검색 반환 확인 |
| B4.5 | **4.5단계 관계 확장 (ontology 도메인)** | B4 | **3파일 세트 + enrichContext()** | **관계 기반 추가 청크 반환 확인** |
| B5 | 2~3단계 AI 분류 + 쿼리변환 | B1 | 프롬프트 + Claude 연동 | 샘플 5건 확인 |
| B6 | 5~6단계 판단 + 검증 | B4.5+B5+A1 | 프롬프트 + 파이프라인 연결 | 샘플 10건 확인 |
| B7 | API 엔드포인트 + SSE | B6 | route.ts | curl 테스트 |

**Track C: 프론트엔드**

| Step | 작업 | 선행 | 산출물 | 검증 |
|------|------|------|--------|------|
| C1 | UI 컴포넌트 (Mock) | B1 | 8개 컴포넌트 | `ui-design` 스킬 참조 |
| C2 | API 연동 + 결과 렌더링 | B7+C1 | page.tsx | E2E 수동 테스트 |

**통합**

| Step | 작업 | 선행 | 산출물 | 검증 |
|------|------|------|--------|------|
| I1 | 통합 테스트 | B7+C2 | pipeline.test.ts + **ontology.test.ts** | 전체 플로우 동작 |
| I2 | 데이터셋 구축 | A1+B6 | test-dataset.json (60건) | `eval-dataset` 스킬 참조 |
| I3 | 정확도 평가 + **온톨로지 A/B 비교** + 튜닝 | I1+I2 | 평가 리포트 | F1 ≥ 0.85 |
| I4 | 배포 | I3 | Vercel URL | 프로덕션 검증 |

### 타임라인

```
Week 1:  A1 ──────────→  │  B1 → B2 → B3  │  (C 대기)
Week 2:  A2 → A3 ──────→ │  B4 → B4.5      │  C1 (Mock)
Week 3:                   │  B5 → B6 → B7   │  C2 ←──(B7)
Week 4:  ──────── 통합: I1 → I2 → I3 → I4 ────────
```

---

# Part 2: Claude Code 인프라 설계 (Phase 1~5)

## 2.1 CLAUDE.md 초안

```markdown
# CLAUDE.md — MediChecker

## 프로젝트 개요
의료광고법(의료법 제56조) 위반 여부를 AI로 자동 검증하는 웹 서비스.
광고 텍스트 → 7단계 RAG 파이프라인 (경량 온톨로지 포함) → 위반 항목 + 수정 가이드.

## 기술 스택
- Frontend/Backend: Next.js 15 (App Router) + React 19 + Tailwind CSS 4
- AI: Claude Sonnet 4.5 + Claude Haiku 4.5 + OpenAI text-embedding-3-small
- DB: Supabase PostgreSQL 15+ (pgvector 0.7+ / pg_trgm)
- 온톨로지: PostgreSQL 관계형 테이블 (law_articles + procedures + relations)
- 배포: Vercel | 패키지: pnpm 9+ | 언어: TypeScript 5.5+ (strict)

## 빌드 & 실행
- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm tsc --noEmit`
- 온톨로지 시드: `pnpm tsx scripts/seed-ontology.ts`
- 벡터 시드: `pnpm tsx scripts/seed-vectors.ts`
- 평가: `pnpm tsx scripts/eval/run-eval.ts`
- 검색 품질: `pnpm tsx scripts/eval/search-quality-test.ts`

## 아키텍처
- DDD 3파일: domain/[도메인명]/ → model.ts + service.ts + repository.ts
- 4개 도메인: verification, rag, ontology, analysis
- 7단계 파이프라인: 1→2→3→4→4.5→5→6
- 프롬프트: src/lib/prompts/ 단계별 분리
- 온톨로지: src/domain/ontology/ (관계 기반 컨텍스트 확장)

## 중요 주의사항
- ⚠️ 프롬프트에서 의료법 조항 임의 해석 금지. RAG + 온톨로지 근거로만 판단.
- ⚠️ 7단계 파이프라인 단계 병합 금지. 2~3단계 병합은 정확도 테스트 후에만.
- ⚠️ 임베딩은 src/lib/embedding.ts EmbeddingProvider로만 접근.
- ⚠️ Supabase 클라이언트는 src/lib/supabase/client.ts에서만 생성.
- ⚠️ 한국어 FTS(to_tsvector) 사용 금지 → pg_trgm similarity() 사용.
- ⚠️ 5~6단계 JSON 스트리밍 금지. 단계 진행 상태만 SSE.
- ⚠️ 온톨로지 테이블(law_articles, procedures, relations) 스키마 변경 시 반드시 ontology 스킬 참조.
- ⚠️ 1단계 키워드는 하드코딩 금지. law_articles.keywords[]에서 동적 로드.
- 환경변수: ANTHROPIC_API_KEY, OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

## 작업 프로세스
Spec 확인 → Plan 수립 → Review → Approve → Implement
각 Step 완료 시 dev/active/mvp/mvp-tasks.md 업데이트.
```

## 2.2 DDD 도메인 타입 정의

### ontology 도메인 🆕

```typescript
// src/domain/ontology/model.ts

export interface LawArticle {
  id: number;
  article: string;           // "제56조"
  clause: string | null;     // "제2항"
  subclause: string | null;  // "제2호"
  title: string;             // "치료경험담"
  summary: string;           // 금지 행위 1줄 요약
  fullText: string | null;
  penalty: string | null;
  keywords: string[];        // 키워드 스캔용
  detectionDifficulty: 'keyword' | 'context' | 'complex';
}

export interface Procedure {
  id: number;
  name: string;              // "보톡스"
  specialty: string;         // "성형외과"
  aliases: string[];         // ["보툴리눔", "보툴렉스"]
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
  weight: number;            // Phase 2 확장용
  metadata: Record<string, unknown>;
}

export interface RelationPath {
  path: string;              // "제56조 제2항 제2호 → relatedCase → [사례 요약]"
  relationType: RelationType;
}

export interface EnrichedContext {
  originalResults: SearchResult[];
  relatedChunks: RelatedChunk[];
  procedureInfo: Procedure | null;
  relationPaths: RelationPath[];
}

export interface RelatedChunk {
  chunkId: number;
  content: string;
  metadata: Record<string, unknown>;
  relationType: RelationType;
  relationSource: string;
}
```

### verification 도메인 (v3 업데이트)

```typescript
// src/domain/verification/model.ts
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
  relationPath?: string;     // v3: 온톨로지 근거 경로
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
    ontologyChunksUsed: number;   // v3: 관계 확장으로 추가된 청크 수
    totalTimeMs: number;
    stageTimings: Record<string, number>;
  };
}

export type VerifyStage =
  | 'keyword_scan'
  | 'classification'
  | 'query_rewrite'
  | 'search'
  | 'relation_enrichment'    // v3: 4.5단계
  | 'judgment'
  | 'verification'
  | 'complete';

export interface VerifyProgress {
  stage: VerifyStage;
  status: 'running' | 'done';
  partialResult?: Partial<VerifyResult>;
}
```

### rag, analysis 도메인

v2와 동일. rag의 SearchResult에 `articleId`, `procedureId` 필드 포함.

## 2.3 Skills 설계

### 추가 스킬: ontology 🆕

```markdown
---
name: ontology
description: "온톨로지 테이블/관계/확장 로직 작성 시 필수 참조"
---

# 온톨로지 스킬

## Purpose
MediChecker의 경량 온톨로지(law_articles, procedures, relations)를 구현하고
관계 기반 컨텍스트 확장 로직을 작성할 때 참조한다.

## 핵심 테이블 3개
- law_articles: 의료법 조항 (노드)
- procedures: 시술 정보 (노드)
- relations: 조항-시술-청크 간 관계 (엣지)

## 관계 유형 (relation_type)
| 타입 | 소스 → 타겟 | 설명 |
|------|------------|------|
| prohibits | article → chunk | 조항이 금지하는 행위 |
| relatedCase | article → chunk | 조항 관련 위반 사례 |
| appliesTo | article → chunk | 적용 매체/상황 |
| requiredDisclosure | procedure → chunk | 필수 고지사항 |
| commonViolation | procedure → article | 시술의 흔한 위반 유형 |
| hasSpecialRegulation | procedure → chunk | 특별 규제 |
| similarTo | article → article | 유사 조항 |
| parentOf | article → article | 상위-하위 관계 |

## Quick Reference
- 4.5단계에서 사용: OntologyService.enrichContext()
- SQL 함수: get_related_context() — 1홉 탐색
- 키워드는 law_articles.keywords[]에서 동적 로드 (하드코딩 금지)

## ✅ DO
- 관계 추가 시 반드시 relation_type 목록에서 선택
- 새 시술 추가 시 aliases (별칭) 반드시 포함
- weight 필드는 기본 1.0 유지 (Phase 2에서 활용)

## ❌ DON'T
- 2홉 이상 탐색 로직 구현 금지 (Phase 2 범위)
- relations 테이블에 정의되지 않은 relation_type 사용 금지
- law_articles/procedures 스키마를 임의 변경 금지

## Phase 2 확장 가이드
resources/graph-rag-expansion.md 참조
```

### legal-data-processing 스킬 업데이트

기존 내용에 온톨로지 구축 가이드 추가:

```markdown
## 온톨로지 데이터 구축 (resources/ontology-construction.md)

### 구축 순서
1. law_articles 테이블 적재: 제56조 각 호별 1행 (A1에서 분석한 결과)
2. procedures 테이블 적재: 주요 시술 50개 (진료과목별)
3. chunks 적재 시 article_id, procedure_id 연결
4. relations 적재: 조항-사례, 시술-조항, 시술-규제 관계

### 관계 구축 원칙
- 법령에서 명시적으로 연결되는 관계만 구축 (추측 금지)
- 해설서에서 언급된 사례-조항 매핑은 relatedCase로
- 시술별 흔한 위반은 해설서/적발 통계 기반으로
- 관계가 불확실하면 weight를 0.5로 설정 (Phase 2에서 조정)

### 출력 파일
- law-articles.json: [{id, article, clause, ...}]
- procedures.json: [{id, name, specialty, aliases, ...}]
- relations.json: [{source_type, source_id, relation_type, target_type, target_id, weight}]
```

### skill-rules.json 업데이트 (ontology 추가)

```json
{
  "ontology": {
    "type": "domain",
    "enforcement": "block",
    "priority": "high",
    "description": "온톨로지 테이블/관계/확장 로직 작성 시 필수 참조",
    "promptTriggers": {
      "keywords": ["온톨로지", "관계", "law_articles", "procedures", "relations", "그래프"],
      "intentPatterns": [
        "(만들|수정|추가).*?(관계|온톨로지|시술|조항)",
        "(확장|enrichment|enrich).*?(컨텍스트|context)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": ["src/domain/ontology/**", "scripts/seed-ontology.ts", "supabase/migrations/**"],
      "contentPatterns": ["law_articles", "procedures", "relations", "relation_type", "enrichContext"]
    }
  }
}
```

> 기존 6개 스킬 + ontology = 총 7개 스킬. 나머지(medical-law, rag-pipeline, ui-design, legal-data-analysis, eval-dataset)는 v2와 동일.

## 2.4 Agents

v2와 동일 (6개: 필수 4 + rag-accuracy-tester + case-curator).

**case-curator 업데이트:** 사례 추가 시 `relations` 테이블에도 관계를 함께 등록하도록 Instructions에 추가.

```markdown
# case-curator Instructions 추가 (v3)
4. 임베딩 + DB 적재
   - chunks 테이블에 INSERT (article_id, procedure_id 연결 필수)
   - relations 테이블에 관계 등록:
     - (article, N) → relatedCase → (chunk, 새청크ID)
     - (procedure, N) → commonViolation → (article, N) (해당 시)
```

## 2.5 Hooks

v2와 동일 (UserPromptSubmit + PostToolUse, Stop 훅 생략).

---

# Part 3: 운영 및 확장

## 3.1 MVP 사용자 플로우

```
[1] medichecker.co 접속
[2] 왼쪽: 텍스트 입력 + 광고 유형 선택
[3] "검증하기" 클릭
[4] 진행 표시:
    "키워드 스캔 ✓ → 분류 완료 ✓ → 법령 검색 ✓ → 관계 분석 ✓ → AI 판단 중..."
[5] 결과:
    - 위험도 게이지 (0~100)
    - 위반 하이라이트 (빨강 90%+ / 노랑 60~89% / 회색 40~59%)
    - 위반 항목: 조항 + 확신도 + 근거 + 관계 경로 + 수정 가이드
[6] 수정 후 "재검증" 가능
```

## 3.2 배포 체크리스트

| 변수 | 발급처 | 용도 |
|------|--------|------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | Claude API |
| `OPENAI_API_KEY` | platform.openai.com | 임베딩 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 대시보드 → Settings → API | DB URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 대시보드 → Settings → API | 서버 DB 접근 |

**배포 순서:**

1. Supabase 프로젝트 생성 + pgvector/pg_trgm 활성화
2. SQL 마이그레이션 (001_initial.sql — 테이블 7개 + 함수 3개 + 인덱스)
3. 온톨로지 시드 (`pnpm tsx scripts/seed-ontology.ts` — law_articles, procedures, relations)
4. 벡터 시드 (`pnpm tsx scripts/seed-vectors.ts` — chunks + 임베딩)
5. Vercel 프로젝트 연결 + 환경변수 설정
6. 배포 → 프로덕션 검증

## 3.3 리스크 및 면책

**면책 조항 (UI):**

> MediChecker는 AI 기반 사전검증 보조 도구이며, 법률 자문을 대체하지 않습니다.
> 최종 판단은 의료법 전문가의 검토를 받으시기 바랍니다.

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| AI 오탐 | 높음 | 6단계 Self-Verification + 확신도 + 근거 필수 |
| AI 미탐 | 매우 높음 | Recall 0.90 + 온톨로지 관계 확장 + 면책 조항 |
| 법령 변경 | 중간 | case-curator + 온톨로지 갱신 |
| 온톨로지 관계 오류 | 중간 | 법령 기반 관계만 구축 (추측 금지), weight 필드로 불확실도 관리 |

## 3.4 Phase 2: 본격 Graph RAG 확장 경로

MVP에서 경량 온톨로지 효과가 검증되면, 다음 단계로 확장:

| 확장 항목 | 현재 (MVP) | Phase 2 |
|----------|-----------|---------|
| 탐색 깊이 | 1홉 (SQL JOIN) | 다중 홉 (재귀 쿼리 or Neo4j) |
| 관계 가중치 | 고정 1.0 | 학습 기반 가중치 (사용 빈도, 정확도 기여도) |
| 서브그래프 추출 | 미지원 | 쿼리 관련 서브그래프 자동 추출 → Claude 입력 |
| 그래프 기반 랭킹 | 미지원 | PageRank 유사 알고리즘으로 중요 노드 식별 |
| 커뮤니티 탐지 | 미지원 | 조항 클러스터 자동 분류 |
| 자동 관계 추출 | 수동 구축 | Claude로 새 사례에서 관계 자동 추출 |

**확장 판단 기준:** MVP에서 온톨로지 A/B 비교 시 F1 향상이 0.03 이상이면 Phase 2 진행. 0.03 미만이면 다른 정확도 개선 방향(프롬프트, 데이터 보강) 우선.

## 3.5 Next Steps 전체 로드맵

| 순위 | 기능 | 설명 |
|------|------|------|
| 1 | 회원가입/인증 | Supabase Auth |
| 2 | 검증 이력 저장 | 과거 결과 조회 |
| 3 | **Phase 2 Graph RAG** | **다중 홉 탐색, 가중치 학습** |
| 4 | 결제 | Free/Pro/Agency (Toss Payments) |
| 5 | PDF 보고서 | 클라이언트 제출용 |
| 6 | API 제공 | 대행사 연동 |
| 7 | 이미지 OCR | 배너/카드뉴스 |
| 8 | 경쟁사 모니터링 | 크롤링 + 위반 탐지 |

---

## 검증 체크리스트

### Spec (Phase 0)

- [ ] 기술 스택 버전 명시 (온톨로지: PostgreSQL 관계형 포함)
- [ ] 디렉토리 구조 확정 (ontology 도메인 포함)
- [ ] 7단계 파이프라인 상세 정의 (4.5단계 포함)
- [ ] DB 스키마 확정 (테이블 4개 + 함수 3개)
- [ ] 성공 기준 (F1 + 온톨로지 기여율)
- [ ] 병렬 트랙 구현 계획

### Claude Code 인프라

- [ ] CLAUDE.md 주의사항 8개 (v3: 온톨로지 스키마 변경 경고, 키워드 동적 로드)
- [ ] 스킬 7개 + skill-rules.json
- [ ] 에이전트 6개 (case-curator 온톨로지 연동 포함)
- [ ] Hooks 설정

### 정확도

- [ ] 테스트 데이터셋 60건
- [ ] 임베딩 Hit Rate ≥ 80%
- [ ] F1-score ≥ 0.85
- [ ] **온톨로지 A/B 비교 완료 (기여율 측정)**

### 배포

- [ ] 환경변수 4개
- [ ] pgvector + pg_trgm 활성화
- [ ] **온톨로지 시드 + 벡터 시드 적재**
- [ ] Vercel 배포 + 프로덕션 검증

---

*"관계를 아는 AI는 단어만 아는 AI보다 강하다."*
