---
name: medical-law
description: "의료법 제56조 및 의료광고 관련 법령 해석 시 필수 참조"
---

# 의료법 스킬

## Purpose
의료법 제56조(의료광고의 금지 등)를 정확하게 해석하고,
AI가 법령을 임의 해석하지 않도록 근거 기반 판단을 강제한다.

## When to Use
- 위반 여부 판단 로직 작성 시
- 프롬프트에서 법령 관련 지침 작성 시
- 테스트 데이터 라벨링 시

## Quick Reference

### 의료법 제56조 제2항 (15개 호)
| 호 | 금지 행위 | 탐지 난이도 |
|----|----------|------------|
| 1호 | 거짓/과장 | complex |
| 2호 | 치료경험담 | context |
| 3호 | 객관적 불확실 과장 | complex |
| 4호 | 신문기사 형식 | keyword |
| 5호 | 환자유인 금품 | keyword |
| 6호 | 외국 허가 오인 | context |
| 7호 | 소비자 현혹 | complex |
| 8호 | 수술 장면 노출 | context |
| 9호 | 경품/할인 방법론적 위반 | context |
| 10호 | 법적 근거 없는 자격 표방 | keyword |
| 11호 | 면허증 등 표시 | keyword |
| 12호 | 미심의 광고 | keyword |
| 13호 | 비급여 비공개 | keyword |
| 14호 | 각종 인증 내용 오인 | context |
| 15호 | 환자 사진 동의 없이 사용 | context |

### 탐지 난이도 분류
- `keyword`: 특정 단어 매칭으로 탐지 (정규식)
- `context`: 문맥 분석 필요 (Haiku 분류)
- `complex`: 복합 판단 필요 (Sonnet 판단)

## ✅ DO
- 법령 원문을 근거로 판단 기준 작성
- 청크에 `article_id` 연결하여 근거 추적 가능하게
- 불확실한 경우 확신도 낮추고 검토 필요 표시
- 해설서/사례 기반 해석 우선

## ❌ DON'T
- AI가 법령을 임의 해석하도록 프롬프트 작성 금지
- RAG 근거 없이 위반 판정 금지
- 확신도 100% 부여 금지 (법적 판단의 불확실성)
- 벌칙 정보 임의 생성 금지

## Resource Files
- [law-article-56.md](resources/law-article-56.md) - 제56조 전문
- [violation-types.md](resources/violation-types.md) - 위반 유형 상세
- [examples.md](resources/examples.md) - 위반/비위반 예시
