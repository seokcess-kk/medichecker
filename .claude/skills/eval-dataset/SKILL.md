---
name: eval-dataset
description: "평가 데이터셋 구축 및 정확도 측정 시 필수 참조"
---

# 평가 데이터셋 스킬

## Purpose
MediChecker의 정확도를 측정하기 위한 테스트 데이터셋을 구축하고,
F1-score ≥ 0.85 달성을 검증한다.

## When to Use
- Track I2: 데이터셋 구축 단계
- 정확도 평가 시
- 프롬프트 튜닝 시

## Quick Reference

### 데이터셋 구성 (60건)
| 카테고리 | 건수 | 설명 |
|---------|------|------|
| 명확한 위반 | 20 | 키워드/표현 기반 |
| 애매한 위반 | 10 | 맥락 판단 필요 |
| 비위반 (정보제공) | 10 | 심의 통과 |
| 비위반 (일반 광고) | 10 | 법령 준수 |
| 경계 사례 | 10 | 해석 분분 |

### 라벨 스키마
```json
{
  "id": "TC001",
  "text": "광고 텍스트...",
  "adType": "blog",
  "expectedViolations": [
    {
      "article": "제56조 제2항 제2호",
      "type": "expression",
      "position": [100, 150],
      "confidence": "high"
    }
  ],
  "isViolation": true,
  "labelConfidence": "high | medium | low",
  "labelSource": "해설서 p.32 사례 참조",
  "notes": "경계 사례, 보수적 판단"
}
```

### 라벨링 기준
| 상황 | 기준 |
|------|------|
| 해설서에 유사 사례 있음 | 해설서 판단 따름 |
| 해설서에 없음 | 보수적 판단 (위반 쪽) |
| 해석 분분 | `labelConfidence: low`, 가중치 하향 |

### 평가 지표
| 지표 | MVP 기준 | 수식 |
|------|---------|------|
| Precision | ≥ 0.85 | TP / (TP + FP) |
| Recall | ≥ 0.90 | TP / (TP + FN) |
| F1-score | ≥ 0.85 | 2 * P * R / (P + R) |

### exampleFix 품질 평가 항목
| 평가 항목 | 설명 | 판정 기준 |
|----------|------|----------|
| 의도 유지 | exampleFix가 원본 광고의 의도를 유지하는가? | 광고 목적이 훼손되면 FAIL |
| 새 위반 없음 | exampleFix 자체에 새로운 위반이 없는가? | 다른 조항 위반 시 FAIL |
| 고지사항 완전성 | omission 위반의 경우 필수 고지사항 전부 포함? | requiredDisclosures 누락 시 FAIL |
| 문체 적합성 | 자연스러운 광고 문체인가? | 법률 문서체면 WARN |

### 온톨로지 A/B 비교
```typescript
// 온톨로지 효과 측정
const withOntology = await pipeline.verify(text, { useOntology: true });
const withoutOntology = await pipeline.verify(text, { useOntology: false });
// F1 차이 = 온톨로지 기여도
```

## ✅ DO
- 각 광고 유형(blog/instagram/youtube) 균등 분포
- 각 호(1~15호) 최소 1건 이상 커버
- 경계 사례는 판단 근거 상세 기록
- 라벨 변경 시 버전 기록

## ❌ DON'T
- 한 유형에 편중된 데이터 금지
- 근거 없는 라벨 금지
- 테스트 데이터로 학습 금지 (프롬프트 튜닝에만 사용)

## Output Files
```
scripts/eval/
├── test-dataset.json     # 테스트 데이터 60건
├── run-eval.ts           # 평가 스크립트
└── eval-report.md        # 평가 결과 리포트
```

## Resource Files
- [labeling-guide.md](resources/labeling-guide.md) - 라벨링 상세 가이드
