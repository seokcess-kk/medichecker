# 메타데이터 스키마

## 청크 메타데이터

### 법령 청크 (source: "law")

```typescript
interface LawChunkMetadata {
  source: "law";
  article: string;          // "제56조 제2항 제2호"
  title: string;            // "치료경험담 광고 금지"
  type: "prohibition";      // 금지 조항
  penalty: string;          // "1년 이하 징역 또는 1천만원 이하 벌금"
}
```

### 해설서 청크 (source: "guideline")

```typescript
interface GuidelineChunkMetadata {
  source: "guideline";
  article: string;          // 관련 조항
  topic: string;            // "치료경험담 판단 기준"
  year: number;             // 2024
  procedure?: string;       // 관련 시술 (있는 경우)
  specialty?: string;       // 관련 진료과목
}
```

### 사례 청크 (source: "case")

```typescript
interface CaseChunkMetadata {
  source: "case";
  article: string;          // 위반/비위반 조항
  caseId: string;           // "2024-001"
  year: number;             // 2024
  specialty: string;        // "성형외과"
  procedure?: string;       // "보톡스"
  adType: string;           // "instagram"
  decision: "위반" | "비위반";
  action?: string;          // "시정명령", "과징금" 등
}
```

## 온톨로지 연결

### law_articles 연결

```typescript
interface LawArticle {
  id: number;
  article: string;           // "제56조"
  clause: string | null;     // "제2항"
  subclause: string | null;  // "제2호"
  title: string;             // "치료경험담"
  summary: string;           // 1줄 요약
  fullText: string | null;   // 조항 원문
  penalty: string | null;
  keywords: string[];        // 정규식 패턴
  detectionDifficulty: "keyword" | "context" | "complex";
}
```

### procedures 연결

```typescript
interface Procedure {
  id: number;
  name: string;              // "보톡스"
  specialty: string;         // "성형외과"
  aliases: string[];         // ["보툴리눔", "나보타"]
  requiredDisclosures: string[];  // 필수 부작용
  commonViolations: string[];     // 흔한 위반 조항
  specialRegulations: string[];   // 특별 규제
}
```

## 메타데이터 검증

### 필수 필드 체크

```typescript
function validateMetadata(chunk: Chunk): boolean {
  const required = ['source', 'article'];

  for (const field of required) {
    if (!chunk.metadata[field]) {
      return false;
    }
  }

  // 최소 6개 필드
  if (Object.keys(chunk.metadata).length < 6) {
    return false;
  }

  return true;
}
```

### 온톨로지 연결 체크

```typescript
function validateOntologyLink(chunk: Chunk): boolean {
  // articleId 또는 procedureId 중 하나는 있어야 함
  return chunk.articleId !== null || chunk.procedureId !== null;
}
```
