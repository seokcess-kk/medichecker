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
```bash
pnpm dev                              # 개발 서버
pnpm build                            # 프로덕션 빌드
pnpm lint                             # ESLint 검사
pnpm tsc --noEmit                     # 타입 체크
pnpm tsx scripts/seed-ontology.ts     # 온톨로지 시드
pnpm tsx scripts/seed-vectors.ts      # 벡터 시드
pnpm tsx scripts/eval/run-eval.ts     # 정확도 평가
pnpm tsx scripts/eval/search-quality-test.ts  # 검색 품질 테스트
```

## 아키텍처
- DDD 3파일 세트: `src/domain/[도메인명]/` → `model.ts` + `service.ts` + `repository.ts`
- 4개 도메인: `verification`, `rag`, `ontology`, `analysis`
- 7단계 파이프라인: 1→2→3→4→4.5→5→6
  - 1단계: 키워드 스캔 (로컬)
  - 2단계: 컨텍스트 분류 (Haiku)
  - 3단계: Query Rewriting (Haiku)
  - 4단계: Hybrid Search (pgvector + pg_trgm)
  - 4.5단계: 관계 기반 컨텍스트 확장 (SQL)
  - 5단계: 위반 판단 (Sonnet)
  - 6단계: Self-Verification (Sonnet)
- 프롬프트: `src/lib/prompts/` 단계별 분리
- 온톨로지: `src/domain/ontology/` (관계 기반 컨텍스트 확장)

## 디렉토리 구조
```
medichecker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── verify/route.ts
│   │       └── embed/route.ts
│   ├── domain/                 # DDD 도메인
│   │   ├── verification/       # 검증 오케스트레이션
│   │   ├── rag/                # Hybrid Search
│   │   ├── ontology/           # 관계 기반 확장
│   │   └── analysis/           # 키워드 분석
│   ├── lib/                    # 공용 라이브러리
│   │   ├── claude.ts
│   │   ├── embedding.ts
│   │   ├── supabase/
│   │   └── prompts/
│   ├── components/             # UI 컴포넌트
│   └── data/                   # 시드 데이터
├── scripts/                    # 스크립트
│   ├── seed-vectors.ts
│   ├── seed-ontology.ts
│   └── eval/
├── supabase/
│   └── migrations/
└── tests/
```

## 중요 주의사항
- ⚠️ 프롬프트에서 의료법 조항 임의 해석 금지. RAG + 온톨로지 근거로만 판단.
- ⚠️ 7단계 파이프라인 단계 병합 금지. 2~3단계 병합은 정확도 테스트 후에만.
- ⚠️ 임베딩은 `src/lib/embedding.ts` EmbeddingProvider로만 접근.
- ⚠️ Supabase 클라이언트는 `src/lib/supabase/client.ts`에서만 생성.
- ⚠️ 한국어 FTS(`to_tsvector`) 사용 금지 → `pg_trgm similarity()` 사용.
- ⚠️ 5~6단계 JSON 스트리밍 금지. 단계 진행 상태만 SSE.
- ⚠️ 온톨로지 테이블(`law_articles`, `procedures`, `relations`) 스키마 변경 시 반드시 `ontology` 스킬 참조.
- ⚠️ 1단계 키워드는 하드코딩 금지. `law_articles.keywords[]`에서 동적 로드.
- ⚠️ 5단계 출력에 `exampleFix`, `originalText` 필드 필수. 예시문이 새로운 위반을 생성하지 않도록 6단계에서 검증.
- ⚠️ AI에게 텍스트 position(문자 인덱스)을 계산시키지 말 것. 위반 텍스트는 `text` 필드로만 전달하고, 하이라이트 위치는 `src/lib/highlight.ts`에서 프론트엔드 문자열 매칭으로 계산.

## 환경변수
```
ANTHROPIC_API_KEY          # Claude API
OPENAI_API_KEY             # 임베딩
NEXT_PUBLIC_SUPABASE_URL   # Supabase URL
SUPABASE_SERVICE_ROLE_KEY  # Supabase 서버 키
```

## 작업 프로세스
1. Spec 확인 (`SPEC.md`)
2. Plan 수립 (`dev/active/mvp/mvp-plan.md`)
3. Review (에이전트 활용)
4. Approve
5. Implement
6. 각 Step 완료 시 `dev/active/mvp/mvp-tasks.md` 업데이트

## 성공 기준
| 지표 | 기준 | 측정 방법 |
|------|------|----------|
| F1-score | ≥ 0.85 | 테스트 데이터셋 60건 |
| 오탐률 (FP) | ≤ 15% | 비위반 20건 중 오탐 수 |
| 미탐률 (FN) | ≤ 10% | 위반 30건 중 미탐 수 |
| 응답 시간 | ≤ 10초 | 1500자 블로그 기준 |
| RAG Hit Rate | ≥ 80% | 쿼리 대비 관련 청크 반환율 |
| 온톨로지 기여율 | ≥ 30% | 관계 확장이 판단에 기여한 비율 |
