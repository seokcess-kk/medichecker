# MVP 컨텍스트

> 📌 결정 이유, 관련 자료 위치, 중요 맥락 기록
> 📅 A1/A2 분석 완료: 2026-03-04

## 프로젝트 정보

- **프로젝트명:** MediChecker
- **버전:** v3.0
- **SPEC 위치:** `/SPEC.md`
- **VIBE GUIDE 위치:** `/VIBE_GUIDE.md`

## 핵심 결정 사항

### 1. 기술 스택 선택

| 결정 | 이유 |
|------|------|
| Next.js 15 (App Router) | RSC + API Routes 단일 프레임워크 |
| Supabase PostgreSQL | pgvector + pg_trgm 네이티브 지원 |
| PostgreSQL 온톨로지 | 별도 그래프 DB 없이 MVP 규모 처리 가능 |
| Tailwind CSS 4 | 유틸리티 퍼스트, 빠른 UI 개발 |

### 2. 7단계 파이프라인 설계

| 결정 | 이유 |
|------|------|
| 단계 분리 | 정확도 우선, 각 단계 역할 집중 |
| 4.5단계 추가 | 경량 온톨로지로 컨텍스트 확장 |
| Haiku + Sonnet 분업 | 비용 최적화 (경량 처리 vs 복합 판단) |

### 3. 온톨로지 전략

| 결정 | 이유 |
|------|------|
| 관계형 테이블 | MVP 규모에서 SQL JOIN으로 충분 |
| 1홉 탐색 제한 | Phase 2에서 다중 홉 확장 예정 |
| 명시적 관계만 | 추측 기반 관계 구축 금지 |

## 중요 파일 위치

### 인프라
```
/CLAUDE.md                        # 프로젝트 기억
/.claude/skills/                  # 7개 스킬
/.claude/skills/skill-rules.json  # 자동 활성화 규칙
/.claude/agents/                  # 6개 에이전트
/.claude/settings.json            # Hooks 설정
```

### 코드 (구현 예정)
```
/src/domain/verification/         # 검증 오케스트레이션
/src/domain/rag/                  # Hybrid Search
/src/domain/ontology/             # 관계 확장
/src/domain/analysis/             # 키워드 분석
/src/lib/prompts/                 # 단계별 프롬프트
```

### 데이터 (구축 예정)
```
/src/data/seed/law-articles.json  # 조항 노드
/src/data/seed/procedures.json    # 시술 노드
/src/data/seed/relations.json     # 관계 엣지
/src/data/seed/*-chunks.json      # 청크 데이터
```

## 주의사항 (CLAUDE.md 참조)

1. 프롬프트에서 의료법 조항 임의 해석 금지
2. 7단계 파이프라인 단계 병합 금지
3. 임베딩은 EmbeddingProvider로만 접근
4. Supabase 클라이언트 단일 출처
5. 한국어 FTS 대신 pg_trgm 사용
6. 5~6단계 JSON 스트리밍 금지
7. 온톨로지 스키마 변경 시 스킬 참조
8. 1단계 키워드 동적 로드 (하드코딩 금지)

## Phase 2 확장 예정

- 다중 홉 탐색 (재귀 쿼리 or Neo4j)
- 가중치 학습
- 서브그래프 추출
- 자동 관계 추출

## 참고 자료

- SPEC.md: 전체 기획서
- VIBE_GUIDE.md: SDD 워크플로우
- Claude API 문서: https://docs.anthropic.com
- Supabase pgvector: https://supabase.com/docs/guides/database/extensions/pgvector

---

# A1: 법령 데이터 분석 결과

> 완료일: 2026-03-04
> 분석 대상: 의료법, 의료법시행령, 의료법시행규칙

## 제56조 제2항 15개 호 요약

| 호 | 제목 | 1줄 요약 | 탐지 난이도 |
|----|------|---------|------------|
| 1호 | 신의료기술 | 평가 미통과 신의료기술 광고 금지 | complex |
| 2호 | 치료경험담 | 환자 후기, 전후사진, 6개월 이하 경력 광고 금지 | context |
| 3호 | 거짓 광고 | 객관적 사실과 다른 거짓 정보 금지 | complex |
| 4호 | 비교 광고 | 다른 의료기관과 비교(최고, 유일 등) 금지 | context |
| 5호 | 비방 광고 | 다른 의료인 비방/불리한 사실 광고 금지 | context |
| 6호 | 수술장면 | 수술 장면, 환부 사진 등 혐오감 유발 자료 금지 | context |
| 7호 | 부작용 누락 | 중요 부작용 정보 누락/은폐 금지 | complex |
| 8호 | 과장 광고 | 객관적 사실 과장(기적, 마법 등) 금지 | complex |
| 9호 | 무자격 표방 | 법적 근거 없는 자격/명칭 표방 금지 | keyword |
| 10호 | 기사형 광고 | 기사/전문가 의견 형태 위장 광고 금지 | keyword |
| 11호 | 미심의 | 심의 없이/다르게 광고 금지 | keyword |
| 12호 | 외국인 유치 | 외국인 환자 유치 국내 광고 금지 | keyword |
| 13호 | 할인 허위 | 비급여 할인 조건 불명확/허위 광고 금지 | context |
| 14호 | 비공인 인증 | 비공인 상장/인증/추천 사용 금지 | context |
| 15호 | 포괄 조항 | 기타 보건/의료 질서 해치는 광고 금지 | complex |

## 키워드 스캔 패턴 (정규식)

상세 패턴은 `src/data/seed/law-articles.json`의 `keywords` 필드 참조.

### 핵심 패턴 예시

- **2호**: `(환자|고객)\s*(후기|리뷰|경험담)`, `전[·\-\s]?후\s*(비교|사진)`
- **3호**: `(100|백)\s*%\s*(성공|완치)`, `부작용\s*(없|전혀)`
- **7호**: `다운타임\s*(없|제로)`, `(부작용|주의사항)\s*(없|안전)`
- **8호**: `기적(적|의)`, `마법(처럼|같은)`, `(국내|세계)\s*최고`

## 5단계 System Prompt 판단 기준

```
1. 근거 기반 판단만 허용: RAG/온톨로지 근거 필수
2. 확신도 범위: 0~95% (100% 금지)
3. 시술별 필수 부작용 체크 (제7호)
4. 복합 위반 가능성 검토
```

---

# A2: 데이터 가공 + 온톨로지 구축 결과

> 완료일: 2026-03-04

## 산출물 파일 목록

| 파일 | 내용 | 항목 수 |
|------|------|--------|
| `law-articles.json` | 조항 노드 | 15개 |
| `procedures.json` | 시술 노드 | 20개 |
| `relations.json` | 관계 엣지 | 37개 |
| `law-chunks.json` | 법령 청크 | 15개 |
| `guidelines-chunks.json` | 해설서 청크 | 15개 |
| `cases-chunks.json` | 사례 청크 | 16개 |

## 청킹 규칙 적용

- 법령: 조항 단위 (1조항=1청크)
- 해설서: 주제 단위 (500토큰 이내)
- 사례: 1사례=1청크

## 메타데이터 필드

모든 청크에 최소 6개 필드 포함:
- `source`: law | guideline | case
- `article`: 관련 조항
- `articleId`: 조항 ID (온톨로지 연결)
- `procedureId`: 시술 ID (온톨로지 연결)
- `year`: 연도
- `type` 또는 `topic`: 분류

## 시술-조항 흔한 위반 매핑

| 시술 | 흔한 위반 조항 |
|------|--------------|
| 보톡스 | 2호, 7호, 8호 |
| 필러 | 2호, 7호, 8호 |
| 리프팅 | 2호, 7호, 8호 |
| 쌍꺼풀 | 2호, 4호, 8호 |
| 임플란트 | 2호, 7호, 13호 |
| 한방다이어트 | 2호, 3호, 8호 |

---

## 다음 단계

- [ ] A3: 시드 적재 + 검색 품질 검증
- [ ] B2: DB 스키마 마이그레이션
- [ ] B3: 1단계 키워드 스캔 구현
