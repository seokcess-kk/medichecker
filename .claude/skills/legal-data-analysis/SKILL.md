---
name: legal-data-analysis
description: "법령 데이터 분석 및 키워드 추출 작업 시 필수 참조"
---

# 법령 데이터 분석 스킬

## Purpose
의료법 제56조 및 관련 해설서, 적발 사례를 분석하여
RAG 시스템의 입력 데이터(키워드, 분류 기준, 관계)를 도출한다.

## When to Use
- Track A1: 법령 분석 단계
- 키워드 패턴 추출 시
- 시술-조항 관계 매핑 시

## Quick Reference

### 분석 대상 (4개 Layer)
| Layer | 소스 | 산출물 |
|-------|------|--------|
| 1 | 의료법 제56조, 시행령 | 조항별 키워드, 탐지 난이도 |
| 2 | 보건복지부 해설서 | 사례-조항 매핑, 해석 기준 |
| 3 | 적발 사례, 판례 | 실제 위반 패턴, 판단 근거 |
| 4 | 시술 정보 | 시술별 필수 고지, 흔한 위반 |

### 분석 체크리스트
```markdown
## 조항별 분석 (15호 각각)
- [ ] 금지 행위 1줄 요약
- [ ] 탐지 난이도 (keyword/context/complex)
- [ ] 핵심 키워드 3~5개
- [ ] 위반 예시 2~3개
- [ ] 비위반 예시 1~2개
- [ ] 벌칙 정보

## 시술별 분석
- [ ] 공식 명칭 + 별칭(aliases)
- [ ] 진료과목
- [ ] 필수 고지 부작용
- [ ] 흔한 위반 유형 (어떤 호 위반?)
- [ ] 특별 규제사항
```

### 키워드 추출 원칙
| 원칙 | 설명 |
|------|------|
| 법령 용어 우선 | "치료 경험담" (O), "후기" (△) |
| 오탐 방지 | 일반 단어는 복합 패턴으로 |
| 정규식 호환 | 특수문자 이스케이프 |
| 별칭 포함 | "보톡스", "보툴리눔", "보툴렉스" |

## ✅ DO
- 해설서 원문 인용하여 해석 근거 기록
- 불확실한 해석은 `confidence: low` 표시
- 시술-조항 관계는 해설서/사례 기반으로만

## ❌ DON'T
- 법령 임의 해석 금지
- 해설서에 없는 관계 추측 금지
- 키워드 누락 (모든 호 커버 필수)

## Output Format
```json
{
  "article": "제56조 제2항 제2호",
  "title": "치료경험담",
  "summary": "환자 경험담으로 치료효과 오인 유발 금지",
  "detectionDifficulty": "context",
  "keywords": ["치료 경험담", "전후사진", "후기"],
  "violationExamples": ["..."],
  "nonViolationExamples": ["..."],
  "relatedProcedures": ["보톡스", "필러", "리프팅"]
}
```

## Resource Files
- [analysis-checklist.md](resources/analysis-checklist.md) - 분석 체크리스트
- [output-template.md](resources/output-template.md) - 출력 템플릿
