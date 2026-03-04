# MVP 작업 체크리스트

> 📌 각 작업 완료 시 체크 및 날짜 기록
> 📌 SDD 워크플로우: Spec → Plan → Review → Approve → Implement

---

## Phase 1~5: 인프라 세팅

### Phase 1: CLAUDE.md ✅
- [x] CLAUDE.md 생성 (2026-03-04)
  - 프로젝트 개요, 기술 스택, 빌드 명령어
  - 아키텍처, 디렉토리 구조
  - 중요 주의사항 8가지
  - 성공 기준

### Phase 2: Skills ✅
- [x] medical-law/SKILL.md (2026-03-04)
- [x] rag-pipeline/SKILL.md (2026-03-04)
- [x] ontology/SKILL.md (2026-03-04)
- [x] ui-design/SKILL.md (2026-03-04)
- [x] legal-data-analysis/SKILL.md (2026-03-04)
- [x] legal-data-processing/SKILL.md (2026-03-04)
- [x] eval-dataset/SKILL.md (2026-03-04)

### Phase 3: skill-rules.json ✅
- [x] skill-rules.json 생성 (2026-03-04)
  - 7개 스킬 규칙 정의
  - promptTriggers (keywords, intentPatterns)
  - fileTriggers (pathPatterns, contentPatterns)

### Phase 4: Agents ✅
- [x] planner.md (2026-03-04)
- [x] plan-reviewer.md (2026-03-04)
- [x] code-architecture-reviewer.md (2026-03-04)
- [x] auto-error-resolver.md (2026-03-04)
- [x] rag-accuracy-tester.md (2026-03-04)
- [x] case-curator.md (2026-03-04)

### Phase 5: Hooks ✅
- [x] .claude/settings.json (2026-03-04)
- [x] hooks/skill-activation-prompt.sh (2026-03-04)
- [x] hooks/post-tool-use-tracker.sh (2026-03-04)

### Phase 6: 외부 기억 문서 ✅
- [x] dev/active/mvp/mvp-plan.md (2026-03-04)
- [x] dev/active/mvp/mvp-context.md (2026-03-04)
- [x] dev/active/mvp/mvp-tasks.md (2026-03-04)

---

## Track A: 데이터 + 온톨로지 구축

### A1: 법령 분석 ✅
- [x] 의료법 제56조 전문 수집 (2026-03-04)
- [x] 15개 호 분석 (키워드, 난이도, 예시) (2026-03-04)
- [x] 보건복지부 해설서 분석 (2026-03-04)
- [x] 적발 사례 수집 (2026-03-04)
- [x] 시술-조항 관계 매핑 (2026-03-04)

### A2: 청킹 + 온톨로지 데이터 구축 ✅
- [x] law-articles.json 작성 (15개 조항) (2026-03-04)
- [x] procedures.json 작성 (50개 시술) (2026-03-04)
- [x] relations.json 작성 (100개 관계) (2026-03-04)
- [x] law-chunks.json 작성 (15개 청크) (2026-03-04)
- [x] guidelines-chunks.json 작성 (15개 청크) (2026-03-04)
- [x] cases-chunks.json 작성 (16개 청크) (2026-03-04)

### A3: 시드 적재 + 검증 ✅
- [x] seed-ontology.ts 실행 (2026-03-04) - 15 law_articles, 50 procedures, 100 relations
- [x] seed-vectors.ts 실행 (2026-03-04) - 46 chunks + 임베딩
- [x] 검색 품질 테스트 (2026-03-04) - Hit Rate 100% (목표 80% 초과 달성)
- [x] 관계 탐색 테스트 (2026-03-04) - get_related_context 동작 확인

---

## Track B: 백엔드

### B1: 프로젝트 초기화 ✅
- [x] pnpm create next-app (2026-03-04)
- [x] TypeScript strict 설정 (2026-03-04)
- [x] Tailwind CSS 4 설정 (2026-03-04)
- [x] Supabase 연결 (2026-03-04)
- [x] Dependencies 설치: @anthropic-ai/sdk, openai, @supabase/supabase-js, @supabase/ssr
- [x] lib/supabase/client.ts + types.ts (2026-03-04)
- [x] lib/embedding.ts EmbeddingProvider (2026-03-04)
- [x] lib/claude.ts Claude API Client (2026-03-04)
- [x] `pnpm tsc --noEmit` 통과 (2026-03-04)
- [x] `pnpm dev` 통과 (2026-03-04)

### B2: DB 스키마 + 함수 ✅
- [x] 001_initial.sql 작성 (2026-03-04)
  - 테이블 4개: law_articles, procedures, relations, chunks
  - 함수 3개: search_similar_chunks, search_keyword_chunks, get_related_context
  - 인덱스 5개: relations(3), chunks_embedding, chunks_content_trgm
- [x] 마이그레이션 실행 (2026-03-04)
- [x] pgvector, pg_trgm 활성화 (2026-03-04)
- [x] 환경변수 설정 (.env.local) (2026-03-04)
- [x] 연결 테스트 통과 (2026-03-04)

### B3: 1단계 키워드 스캔 ✅ (파일 생성)
- [x] analysis/model.ts (2026-03-04)
- [x] analysis/service.ts (2026-03-04)
- [x] analysis/repository.ts (2026-03-04)
- [ ] 단위 테스트 (DB 연결 후)

### B4: 4단계 Hybrid Search ✅
- [x] rag/model.ts (2026-03-04) - Chunk, SearchResult, HybridSearchConfig
- [x] rag/service.ts (2026-03-04) - RRF 점수 병합 (시맨틱 0.6 + 키워드 0.4)
- [x] rag/repository.ts (2026-03-04) - search_similar_chunks + search_keyword_chunks
- [x] 검색 테스트 (2026-03-04) - 5개 쿼리 중 4개 정상 (80%)

### B4.5: 4.5단계 관계 확장 ✅
- [x] ontology/model.ts (2026-03-04) - LawArticle, Procedure, Relation, EnrichedContext
- [x] ontology/service.ts (2026-03-04) - enrichContext() + buildRelationPaths()
- [x] ontology/repository.ts (2026-03-04) - get_related_context, findProcedure
- [x] enrichContext 테스트 (2026-03-04) - 3건 테스트 모두 성공

### B5: 2~3단계 AI 분류 ✅
- [x] prompts/classification.ts (2026-03-04)
- [x] prompts/query-rewrite.ts (2026-03-04)
- [x] lib/claude.ts Claude Haiku 연동 (2026-03-04)
- [x] 샘플 5건 확인 (2026-03-04) - 파이프라인 테스트로 검증

### B6: 5~6단계 판단 + 검증 ✅
- [x] prompts/judgment.ts (2026-03-04)
- [x] prompts/verification.ts (2026-03-04)
- [x] verification/service.ts 오케스트레이션 (2026-03-04)
- [x] judgeViolation() + verifySelf() 구현 (2026-03-04)
- [x] 샘플 10건 테스트 (2026-03-04) - F1 0.88 달성

### B7: API 엔드포인트 ✅
- [x] api/verify/route.ts (2026-03-04)
- [x] api/embed/route.ts (2026-03-04)
- [x] SSE 구현 (2026-03-04)
- [x] curl 테스트 (2026-03-04) - SSE 이벤트 + JSON 응답 확인

---

## Track C: 프론트엔드

### C1: UI 컴포넌트 (Mock) ✅
- [x] TextInput.tsx (기존)
- [x] AdTypeSelector.tsx (기존)
- [x] VerifyButton.tsx (기존)
- [x] ResultPanel.tsx (기존)
- [x] RiskScore.tsx (기존)
- [x] ViolationHighlight.tsx (기존)
- [x] ViolationItem.tsx (기존)
- [x] ProgressIndicator.tsx (기존)

### C2: API 연동
- [ ] page.tsx 통합
- [ ] SSE 연결
- [ ] 결과 렌더링

---

## 통합

### I1: 통합 테스트 ✅
- [x] pipeline.test.ts (2026-03-04) - 14 tests, F1 1.00
- [x] ontology.test.ts (2026-03-04) - 20 tests 통과
- [x] 전체 플로우 검증 (2026-03-04) - Vitest 설정, 34 tests 통과

### I2: 데이터셋 구축 ✅
- [x] test-dataset.json (60건) (2026-03-04)
  - 명확한 위반: 20건
  - 애매한 위반: 10건
  - 비위반 (정보제공): 10건
  - 비위반 (일반 광고): 10건
  - 경계 사례: 10건
- [x] 라벨링 완료 (2026-03-04) - 15개 호 전체 커버, 4개 광고 유형 분포

### I3: 정확도 평가 + 튜닝 ✅
- [x] run-eval.ts 실행 (2026-03-04) - 60건 평가
- [x] F1 ≥ 0.85 달성 (2026-03-04) - **F1 = 0.853**
  - Precision: 74.4% | Recall: 100% | Accuracy: 83.3%
  - TP: 29 | FN: 0 | FP: 10 | TN: 21
- [x] 온톨로지 A/B 비교 (2026-03-04)
  - With Ontology: F1 = 0.853 (Recall 100%)
  - Without Ontology: F1 = 0.875 (Recall 96.6%)
  - 기여율: -2.2% (온톨로지가 Recall 향상, Precision 하락)

### I4: 배포 ✅
- [x] Vercel 프로젝트 생성 (2026-03-04)
- [x] 환경변수 설정 (2026-03-04) - 4개 환경변수 Production에 설정
- [x] 프로덕션 배포 (2026-03-04) - https://medichecker-black.vercel.app
- [x] 최종 검증 (2026-03-04) - API 동작 확인 (위험도 80, 위반 1건 감지)
- [x] Claude 모델 ID 수정 (2026-03-04) - Haiku 모델로 임시 대체 (Sonnet 접근 권한 필요)

---

## 완료 기록

| 날짜 | 완료 항목 | 비고 |
|------|----------|------|
| 2026-03-04 | Phase 1~5 인프라 세팅 | CLAUDE.md, 7 Skills, 6 Agents, Hooks, 3대 문서 |
| 2026-03-04 | B1: Next.js 15 프로젝트 초기화 | DDD 4도메인 12파일, lib 파일, API Routes, tsc/dev 통과 |
| 2026-03-04 | B2: DB 스키마 + 마이그레이션 | 테이블 4개, 함수 3개, 연결 테스트 통과 |
| 2026-03-04 | A1: 법령 분석 | 15개 호 분석, 해설서/사례 수집, 시술-조항 매핑 |
| 2026-03-04 | A2: 온톨로지 데이터 구축 | 50개 시술, 100개 관계, 46개 청크 (법령15+해설15+사례16) |
| 2026-03-04 | A3: 시드 적재 + 검증 | Hit Rate 100%, 관계 확장 동작 확인 |
| 2026-03-04 | B4: Hybrid Search | RRF 순위 결합, 테스트 통과 |
| 2026-03-04 | B4.5: 관계 기반 확장 | enrichContext 동작, 시술 특화 정보 |
| 2026-03-04 | B6: 5~6단계 판단 + 검증 | judgeViolation + verifySelf, 10건 테스트 F1 0.88 |
| 2026-03-04 | B7: API 엔드포인트 | SSE 스트리밍 + JSON 응답 curl 테스트 통과 |
| 2026-03-04 | I1: 통합 테스트 | Vitest 설정, pipeline.test.ts (14 tests), ontology.test.ts (20 tests), F1 1.00 |
| 2026-03-04 | I2: 데이터셋 구축 | 60건 (위반29/비위반31), 15개 호 전체 커버, 4개 광고 유형 분포 |
| 2026-03-04 | I3: 정확도 평가 | F1=0.853 달성, Recall 100%, A/B 비교 완료 |
| 2026-03-04 | I4: Vercel 배포 | https://medichecker-black.vercel.app, 환경변수 4개 설정, API 동작 확인 |
| 2026-03-04 | exampleFix 기능 구현 | 수정 예시문 기능 추가 - Violation 타입에 originalText/exampleFix 필드, 5~6단계 프롬프트 수정, ExampleFix UI 컴포넌트 |
| 2026-03-04 | 하이라이트 정확도 개선 | AI position 계산 제거 → 프론트엔드 문자열 매칭 (src/lib/highlight.ts), 3단계 매칭 (정확, 정규화, 핵심구절), omission 위반 별도 표시 |
