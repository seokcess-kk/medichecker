---
name: ontology
description: "온톨로지 테이블/관계/확장 로직 작성 시 필수 참조"
---

# 온톨로지 스킬

## Purpose
MediChecker의 경량 온톨로지(law_articles, procedures, relations)를 구현하고
관계 기반 컨텍스트 확장 로직을 작성할 때 참조한다.

## When to Use
- 온톨로지 테이블 스키마 작업 시
- 관계 데이터 구축 시
- 4.5단계 enrichContext 로직 작성 시

## Quick Reference

### 핵심 테이블 3개
```
law_articles    → 의료법 조항 (노드)
procedures      → 시술 정보 (노드)
relations       → 조항-시술-청크 간 관계 (엣지)
```

### 관계 유형 (relation_type)
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

### 4.5단계 핵심 함수
```typescript
// src/domain/ontology/service.ts
OntologyService.enrichContext(searchResults, procedureId)
  → relatedChunks + procedureInfo + relationPaths

// SQL 함수
get_related_context(article_ids[], procedure_ids[])
  → 1홉 탐색으로 관련 컨텍스트 수집
```

### 관계 경로 예시
```
"제56조 제2항 제2호 → relatedCase → [2024 A피부과 적발]"
"보톡스 → commonViolation → 제3호(과장광고)"
```

## ✅ DO
- 관계 추가 시 반드시 `relation_type` 목록에서 선택
- 새 시술 추가 시 `aliases` (별칭) 반드시 포함
- `weight` 필드는 기본 1.0 유지 (Phase 2에서 활용)
- 법령에서 명시적으로 연결되는 관계만 구축

## ❌ DON'T
- 2홉 이상 탐색 로직 구현 금지 (Phase 2 범위)
- `relations` 테이블에 정의되지 않은 `relation_type` 사용 금지
- `law_articles`/`procedures` 스키마 임의 변경 금지
- 추측 기반 관계 구축 금지

## Resource Files
- [schema.md](resources/schema.md) - DB 스키마 상세
- [relation-types.md](resources/relation-types.md) - 관계 유형 정의
- [graph-rag-expansion.md](resources/graph-rag-expansion.md) - Phase 2 확장 가이드
