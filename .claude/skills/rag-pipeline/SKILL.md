---
name: rag-pipeline
description: "RAG 파이프라인(청킹, 임베딩, 검색) 구현 시 필수 참조"
---

# RAG 파이프라인 스킬

## Purpose
MediChecker의 7단계 RAG 파이프라인을 정확하게 구현하고,
검색 품질과 정확도를 보장한다.

## When to Use
- 청킹/임베딩 로직 작성 시
- 검색 쿼리 최적화 시
- 파이프라인 단계 수정 시

## Quick Reference

### 7단계 파이프라인 흐름
```
[1] 키워드 스캔 (로컬, ~50ms)
    ↓
[2] 컨텍스트 분류 (Haiku, ~1s)
    ↓
[3] Query Rewriting (Haiku, ~1s)
    ↓
[4] Hybrid Search (Supabase, ~300ms)
    ↓
[4.5] 관계 기반 확장 (SQL, ~100ms)  ← ontology 스킬 참조
    ↓
[5] 위반 판단 (Sonnet, ~4s)
    ↓
[6] Self-Verification (Sonnet, ~3s)
```

### Hybrid Search 구성
| 방식 | 엔진 | RRF 가중치 |
|------|------|-----------|
| 시맨틱 | pgvector | 0.6 |
| 키워드 | pg_trgm | 0.4 |

### 임베딩 설정
- 모델: `text-embedding-3-small`
- 차원: 1536
- 반드시 `EmbeddingProvider` 인터페이스 사용

## ✅ DO
- Top-10 청크 반환 (법령 + 사례 + 해설서 혼합)
- 각 청크에 `article_id`, `procedure_id` 연결 유지
- RRF(Reciprocal Rank Fusion)로 하이브리드 순위 결합
- 검색 결과에 유사도 점수 포함

## ❌ DON'T
- `to_tsvector('korean')` 사용 금지 → `pg_trgm similarity()` 사용
- 단계 순서 변경 금지
- 2~3단계 병합은 정확도 테스트 없이 금지
- 임베딩 직접 호출 금지 → EmbeddingProvider 사용
- 파이프라인 출력에서 `position` 기반 참조를 사용하지 않음. 문자열 매칭 방식으로 전환됨 (`src/lib/highlight.ts` 참조)

## Resource Files
- [chunking.md](resources/chunking.md) - 청킹 전략
- [search.md](resources/search.md) - 검색 최적화
