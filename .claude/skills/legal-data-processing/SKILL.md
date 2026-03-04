---
name: legal-data-processing
description: "법령 데이터 청킹, 임베딩, 온톨로지 구축 시 필수 참조"
---

# 법령 데이터 처리 스킬

## Purpose
분석된 법령 데이터를 청크로 분할하고, 온톨로지 테이블에 적재하여
RAG 시스템에서 검색 가능하게 만든다.

## When to Use
- Track A2: 청킹 + 온톨로지 데이터 구축 단계
- 시드 데이터 생성 시
- 임베딩 적재 시

## Quick Reference

### 청킹 전략
| 소스 | 청크 크기 | 오버랩 |
|------|----------|--------|
| 법령 조항 | 조항 단위 | 없음 |
| 해설서 | 500자 | 50자 |
| 적발 사례 | 사례 단위 | 없음 |

### 메타데이터 필수 필드
```json
{
  "source": "law | guideline | case",
  "article": "제56조 제2항 제2호",
  "specialty": "성형외과",
  "ad_type": "blog | instagram | youtube",
  "year": 2024
}
```

### 온톨로지 구축 순서
```
1. law_articles 테이블 적재 (A1 분석 결과)
   → 제56조 각 호별 1행

2. procedures 테이블 적재 (주요 시술 50개)
   → 진료과목별 분류
   → aliases 필수 포함

3. chunks 적재 시 article_id, procedure_id 연결
   → 벡터 임베딩 + 온톨로지 연결 동시 처리

4. relations 적재
   → 조항-사례 (relatedCase)
   → 시술-조항 (commonViolation)
   → 시술-규제 (hasSpecialRegulation)
```

### 관계 구축 원칙
| 원칙 | 설명 |
|------|------|
| 명시적 연결만 | 법령/해설서에 언급된 관계만 |
| 불확실 = weight 0.5 | 확실 = 1.0, 불확실 = 0.5 |
| 출처 기록 | metadata에 근거 문서 기록 |

## ✅ DO
- 청크마다 `article_id` 또는 `procedure_id` 연결
- 임베딩 전 텍스트 정규화 (줄바꿈, 공백)
- 시드 파일은 JSON 형식으로 버전 관리

## ❌ DON'T
- 청크 크기 2000자 초과 금지
- 메타데이터 없는 청크 금지
- 중복 청크 적재 금지
- 추측 기반 관계 구축 금지

## Output Files
```
src/data/seed/
├── law-chunks.json       # 법령 청크
├── guidelines-chunks.json # 해설서 청크
├── cases-chunks.json     # 사례 청크
├── law-articles.json     # 조항 노드
├── procedures.json       # 시술 노드
└── relations.json        # 관계 엣지
```

## Resource Files
- [chunking-rules.md](resources/chunking-rules.md) - 청킹 규칙
- [metadata-schema.md](resources/metadata-schema.md) - 메타데이터 스키마
- [ontology-construction.md](resources/ontology-construction.md) - 온톨로지 구축 가이드
