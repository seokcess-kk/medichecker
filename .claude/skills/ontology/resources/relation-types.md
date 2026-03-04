# 온톨로지 관계 유형 정의

## 관계 유형 목록

| relation_type | 소스 → 타겟 | 설명 | 예시 |
|---------------|------------|------|------|
| `prohibits` | article → chunk | 조항이 금지하는 행위 | 2호 → "환자 후기 작성 대행" |
| `relatedCase` | article → chunk | 조항 관련 위반 사례 | 2호 → "2024 A피부과 적발" |
| `appliesTo` | article → chunk | 적용 매체/상황 | 2호 → "블로그, 인스타그램" |
| `requiredDisclosure` | procedure → chunk | 필수 고지사항 | 보톡스 → "멍, 두통, 비대칭" |
| `commonViolation` | procedure → article | 시술의 흔한 위반 유형 | 보톡스 → 2호(전후사진) |
| `hasSpecialRegulation` | procedure → chunk | 특별 규제 | 성형 → "사전심의 의무" |
| `similarTo` | article → article | 유사 조항 | 3호 ↔ 8호 (거짓/과장 경계) |
| `parentOf` | article → article | 상위-하위 관계 | 1호 → 3호 (신의료기술→거짓) |

## 관계 구축 원칙

### DO
1. 법령/해설서에 명시된 관계만 구축
2. 불확실한 관계는 `weight: 0.5`로 설정
3. `metadata`에 근거 문서 기록

### DON'T
1. 추측 기반 관계 구축 금지
2. 정의되지 않은 relation_type 사용 금지
3. 2홉 이상 탐색 관계 구축 금지 (Phase 2 범위)

## 관계 예시

### procedure → article (commonViolation)

```json
{
  "sourceType": "procedure",
  "sourceId": 1,
  "relationType": "commonViolation",
  "targetType": "article",
  "targetId": 2,
  "weight": 1.0,
  "metadata": {"note": "보톡스 전후사진 비교 광고 흔함"}
}
```

### article → article (similarTo)

```json
{
  "sourceType": "article",
  "sourceId": 3,
  "relationType": "similarTo",
  "targetType": "article",
  "targetId": 8,
  "weight": 0.8,
  "metadata": {"note": "거짓 광고와 과장 광고는 경계가 모호함"}
}
```

## 4.5단계에서의 활용

```typescript
// OntologyService.enrichContext()에서 사용
const relatedContext = await repository.getRelatedContext(
  articleIds,    // 4단계 검색 결과의 article_id들
  procedureIds   // 2단계에서 추출한 procedure_id
);

// 관계 경로 생성
// "제56조 제2항 제2호 → relatedCase → [2024 A피부과 적발]"
// "보톡스 → commonViolation → 제8호(과장광고)"
```
