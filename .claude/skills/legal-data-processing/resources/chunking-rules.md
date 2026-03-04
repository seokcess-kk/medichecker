# 청킹 규칙

## 소스별 청킹 전략

| 소스 | 청킹 단위 | 크기 제한 | 오버랩 |
|------|----------|----------|--------|
| 법령 조항 | 조항 단위 | 500토큰 | 없음 |
| 해설서 | 주제/섹션 단위 | 500토큰 | 50토큰 |
| 적발 사례 | 1사례 = 1청크 | 500토큰 | 없음 |

## 청크 크기 가이드라인

- **최소**: 100토큰 (너무 짧으면 맥락 부족)
- **최대**: 500토큰 (검색 효율성 유지)
- **권장**: 300~400토큰

## 메타데이터 필수 필드 (6개 이상)

```json
{
  "source": "law | guideline | case",
  "article": "제56조 제2항 제2호",
  "title": "치료경험담 광고 금지",
  "type": "prohibition | guidance | violation | non-violation",
  "year": 2024,
  "specialty": "성형외과"
}
```

### 선택 필드

```json
{
  "procedure": "보톡스",
  "adType": "blog | instagram | youtube | homepage | banner",
  "caseId": "2024-001",
  "decision": "위반 | 비위반",
  "action": "시정명령 | 과징금 | 의료업 정지"
}
```

## 온톨로지 연결 필수

모든 청크에 가능한 경우:
- `articleId`: law_articles 테이블 ID
- `procedureId`: procedures 테이블 ID

```json
{
  "content": "보톡스 시술 후 부작용...",
  "metadata": { ... },
  "articleId": 7,
  "procedureId": 1
}
```

## 청킹 품질 체크리스트

- [ ] 모든 청크 500토큰 이내
- [ ] 메타데이터 6개 필드 이상
- [ ] articleId 또는 procedureId 연결
- [ ] 중복 청크 없음
- [ ] 텍스트 정규화 (줄바꿈, 공백)
