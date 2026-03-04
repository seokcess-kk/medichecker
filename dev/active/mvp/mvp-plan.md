# MVP 구현 계획

> 📌 SPEC.md v3.0 기반
> 📌 SDD 워크플로우 준수

## 목표
의료광고법 제56조 위반 여부를 AI로 자동 검증하는 MVP 웹 서비스 구현.

## 병렬 트랙 구조

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

## Track A: 데이터 + 온톨로지 구축

| Step | 작업 | 선행 | 산출물 | 검증 |
|------|------|------|--------|------|
| A1 | 법령 분석 | - | 키워드 리스트, 15호 분류, 시술-조항 관계 매핑 | `legal-data-analysis` 스킬 참조 |
| A2 | 청킹 + 온톨로지 데이터 구축 | A1 | law-chunks.json, law-articles.json, procedures.json, relations.json | `legal-data-processing` 스킬 참조 |
| A3 | 시드 적재 + 검색 품질 검증 | A2+B2 | DB 적재, Hit Rate 리포트 | Hit Rate ≥ 80% |

## Track B: 백엔드

| Step | 작업 | 선행 | 산출물 | 검증 |
|------|------|------|--------|------|
| B1 | Next.js 초기화 + Supabase 연결 | - | 스캐폴딩 | `pnpm dev` + DB 연결 |
| B2 | DB 스키마 + 함수 | B1 | 001_initial.sql | 마이그레이션 성공 |
| B3 | 1단계 키워드 스캔 | B1 | analysis 도메인 | 단위 테스트 |
| B4 | 4단계 Hybrid Search | B2+A3 | rag 도메인 | 검색 반환 확인 |
| B4.5 | 4.5단계 관계 확장 | B4 | ontology 도메인 | 관계 확장 동작 확인 |
| B5 | 2~3단계 AI 분류 | B1 | 프롬프트 + Claude 연동 | 샘플 5건 확인 |
| B6 | 5~6단계 판단 + 검증 | B4.5+B5+A1 | 프롬프트 + 파이프라인 | 샘플 10건 확인 |
| B7 | API 엔드포인트 + SSE | B6 | route.ts | curl 테스트 |

## Track C: 프론트엔드

| Step | 작업 | 선행 | 산출물 | 검증 |
|------|------|------|--------|------|
| C1 | UI 컴포넌트 (Mock) | B1 | 8개 컴포넌트 | `ui-design` 스킬 참조 |
| C2 | API 연동 + 결과 렌더링 | B7+C1 | page.tsx | E2E 수동 테스트 |

## 통합

| Step | 작업 | 선행 | 산출물 | 검증 |
|------|------|------|--------|------|
| I1 | 통합 테스트 | B7+C2 | pipeline.test.ts | 전체 플로우 동작 |
| I2 | 데이터셋 구축 | A1+B6 | test-dataset.json (60건) | `eval-dataset` 스킬 참조 |
| I3 | 정확도 평가 + 튜닝 | I1+I2 | 평가 리포트 | F1 ≥ 0.85 |
| I4 | 배포 | I3 | Vercel URL | 프로덕션 검증 |

## 성공 기준
- F1-score ≥ 0.85
- 오탐률 ≤ 15%
- 미탐률 ≤ 10%
- 응답 시간 ≤ 10초
- RAG Hit Rate ≥ 80%
- 온톨로지 기여율 ≥ 30%

## 참조 스킬
- `medical-law`: 법령 해석, 위반 판단
- `rag-pipeline`: 파이프라인 구현
- `ontology`: 온톨로지 구축, 관계 확장
- `ui-design`: UI 컴포넌트
- `legal-data-analysis`: 법령 분석
- `legal-data-processing`: 데이터 처리
- `eval-dataset`: 평가 데이터셋
