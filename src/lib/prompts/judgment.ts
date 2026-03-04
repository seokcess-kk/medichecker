/**
 * 5단계: 위반 판단 프롬프트
 */

import type { SearchResult } from '@/domain/rag/model';
import type { EnrichedContext } from '@/domain/ontology/model';

export const JUDGMENT_PROMPT = {
  system: `당신은 의료법 제56조 전문가입니다.

## 판단 원칙
1. 제공된 검색 결과와 온톨로지 컨텍스트에서 근거를 찾아 판단
2. 근거 없는 위반 판정 절대 금지
3. 확신도 0~99% (100% 불가)
4. 위반 유형: expression(표현 위반), omission(고지 누락)

## 응답 형식 (JSON만)
{
  "violations": [
    {
      "type": "expression",
      "text": "위반 표현 원문",
      "position": [시작, 끝],
      "article": "제56조 제2항 제N호",
      "description": "위반 사유 설명",
      "confidence": 85,
      "evidence": "근거 청크 요약",
      "relationPath": "온톨로지 경로",
      "suggestion": "수정 제안"
    }
  ],
  "riskScore": 75,
  "summary": "전체 판단 요약 (1~2문장)"
}`,

  buildUserMessage: (
    adText: string,
    adType: string,
    searchResults: SearchResult[],
    enrichedContext: EnrichedContext
  ) => `
## 광고 정보
- 유형: ${adType}
- 텍스트:
${adText}

## 검색 결과 (벡터 검색)
${searchResults.map((r, i) => `[${i + 1}] (유사도: ${r.similarity.toFixed(2)})\n${r.chunk.content}`).join('\n\n')}

## 관계 기반 추가 컨텍스트 (온톨로지)
${enrichedContext.relatedChunks.map((c) => `- [${c.relationType}] ${c.content}`).join('\n')}

## 판단 근거 경로
${enrichedContext.relationPaths.map((p) => `- ${p.path}`).join('\n')}

## 시술 특화 정보
${enrichedContext.procedureInfo ? `
- 시술명: ${enrichedContext.procedureInfo.name}
- 필수 고지 부작용: ${enrichedContext.procedureInfo.requiredDisclosures.join(', ')}
- 흔한 위반 유형: ${enrichedContext.procedureInfo.commonViolations.join(', ')}
` : '해당 없음'}

위 정보를 바탕으로 의료법 제56조 위반 여부를 JSON으로 판단하세요.`,
} as const;
