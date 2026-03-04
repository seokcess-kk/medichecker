# Phase 2 Graph RAG 확장 가이드

> MVP 이후 온톨로지 확장 로드맵

## MVP (현재) vs Phase 2

| 항목 | MVP | Phase 2 |
|------|-----|---------|
| 탐색 깊이 | 1홉 (SQL JOIN) | 다중 홉 (재귀 쿼리 or Neo4j) |
| 관계 가중치 | 고정 1.0 | 학습 기반 가중치 |
| 서브그래프 추출 | 미지원 | 쿼리 관련 서브그래프 자동 추출 |
| 그래프 기반 랭킹 | 미지원 | PageRank 유사 알고리즘 |
| 자동 관계 추출 | 수동 구축 | Claude로 새 사례에서 자동 추출 |

## 확장 판단 기준

MVP에서 온톨로지 A/B 비교 결과:
- **F1 향상 ≥ 0.03**: Phase 2 진행
- **F1 향상 < 0.03**: 다른 정확도 개선 방향 우선

## Phase 2 구현 항목

### 1. 다중 홉 탐색

```sql
-- 재귀 쿼리 예시
WITH RECURSIVE relation_path AS (
  -- 시작점
  SELECT source_id, target_id, relation_type, 1 as depth
  FROM relations
  WHERE source_type = 'article' AND source_id = ANY($1)

  UNION ALL

  -- 재귀 (2홉까지)
  SELECT r.source_id, r.target_id, r.relation_type, rp.depth + 1
  FROM relations r
  JOIN relation_path rp ON r.source_id = rp.target_id
  WHERE rp.depth < 2
)
SELECT * FROM relation_path;
```

### 2. 가중치 학습

```typescript
interface WeightLearning {
  // 관계가 최종 판단에 기여했는지 피드백
  updateWeight(relationId: number, contributed: boolean): void;

  // 정기적 가중치 재계산
  recalculateWeights(): void;
}
```

### 3. 서브그래프 추출

```typescript
async function extractSubgraph(
  query: string,
  articleIds: number[],
  procedureIds: number[]
): Promise<Subgraph> {
  // 1. 관련 노드 수집 (2홉 이내)
  // 2. 노드 간 엣지 수집
  // 3. 서브그래프 시각화 또는 Claude 입력용 텍스트 변환
}
```

### 4. 자동 관계 추출

```typescript
async function extractRelationsFromCase(
  caseContent: string
): Promise<Relation[]> {
  // Claude에게 사례에서 관계 추출 요청
  const prompt = `
    다음 위반 사례에서 조항-시술-행위 간 관계를 추출하세요.
    기존 relation_type 목록: prohibits, relatedCase, commonViolation, ...
  `;

  const response = await claude.complete(prompt + caseContent);
  return parseRelations(response);
}
```

## Neo4j 마이그레이션 (선택)

MVP 규모를 벗어나면 Neo4j 고려:

```cypher
// 노드 생성
CREATE (a:Article {id: 2, title: '치료경험담'})
CREATE (p:Procedure {id: 1, name: '보톡스'})

// 관계 생성
MATCH (a:Article), (p:Procedure)
WHERE a.id = 2 AND p.id = 1
CREATE (p)-[:COMMON_VIOLATION {weight: 1.0}]->(a)

// 다중 홉 탐색
MATCH path = (p:Procedure)-[*1..3]-(a:Article)
WHERE p.name = '보톡스'
RETURN path
```

## 주의사항

- Phase 2 진입 전 MVP 안정화 필수
- 다중 홉 탐색 시 성능 모니터링 필수
- 가중치 학습은 충분한 피드백 데이터 확보 후
