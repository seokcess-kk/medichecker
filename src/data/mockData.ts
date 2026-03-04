import { Violation, VerifyResult, VerifyStage } from '@/domain/verification/model';

export const MOCK_VIOLATIONS: Violation[] = [
  {
    type: 'expression',
    text: '시술 후 10살은 어려 보입니다',
    position: [45, 62],
    article: '의료법 제56조 제2항 제3호',
    description: '치료 효과에 관하여 객관적으로 인정되지 아니하거나 근거가 없는 과장 광고',
    confidence: 95,
    evidence: '객관적 근거 없이 10살 젊어 보인다는 효과를 단정적으로 표현함',
    relationPath: '제56조 제2항 제3호 → prohibits → 과장 광고 표현',
    suggestion: '"피부 탄력 개선에 도움이 될 수 있습니다" (개인차 있음 명시)',
  },
  {
    type: 'expression',
    text: '환자 A씨는 "완전히 새 사람이 됐어요"라고 말했습니다',
    position: [120, 155],
    article: '의료법 제56조 제2항 제2호',
    description: '치료 경험담 등을 이용하여 소비자로 하여금 치료 효과를 오인하게 할 우려가 있는 광고',
    confidence: 92,
    evidence: '환자의 치료 경험담을 인용하여 치료 효과를 오인하게 함',
    relationPath: '제56조 제2항 제2호 → relatedCase → [2024 A피부과 적발]',
    suggestion: '환자 경험담 삭제 또는 "개인의 의견이며 효과는 개인에 따라 다를 수 있습니다" 명시',
  },
  {
    type: 'omission',
    text: '보톡스 시술',
    position: [10, 17],
    article: '의료법 제56조 제2항 제9호',
    description: '의료인의 기능, 진료방법에 관한 사항으로서 심의를 받지 않은 광고',
    confidence: 75,
    evidence: '보톡스 시술 부작용(멍, 비대칭, 두통 등) 고지 누락',
    relationPath: '보톡스 → requiredDisclosure → [멍, 비대칭, 두통]',
    suggestion: '시술 부작용 및 주의사항 고지 추가: "시술 후 멍, 붓기, 비대칭 등이 발생할 수 있습니다"',
  },
  {
    type: 'expression',
    text: '이 시술은 100% 안전합니다',
    position: [200, 215],
    article: '의료법 제56조 제2항 제3호',
    description: '치료 효과에 관하여 객관적으로 인정되지 아니하거나 근거가 없는 과장 광고',
    confidence: 55,
    evidence: '100% 안전을 보장하는 의료 시술은 존재하지 않음',
    relationPath: '제56조 제2항 제3호 → prohibits → 안전성 보장 표현',
    suggestion: '"의료진의 충분한 상담 후 안전하게 시술을 진행합니다"',
    reviewNote: '문맥에 따라 검토 필요 (단순 설명 vs 광고 문구)',
  },
];

export const MOCK_RESULT: VerifyResult = {
  violations: MOCK_VIOLATIONS,
  riskScore: 78,
  summary: '총 4건의 의료법 위반 의심 항목이 발견되었습니다. 2건은 높은 확신도(90% 이상)로 수정이 필요하며, 1건은 주의가 필요하고, 1건은 검토를 권장합니다.',
  metadata: {
    keywordMatches: 5,
    ragChunksUsed: 12,
    ontologyChunksUsed: 4,
    totalTimeMs: 8234,
    stageTimings: {
      keyword_scan: 48,
      classification: 1023,
      query_rewrite: 987,
      search: 312,
      relation_enrichment: 89,
      judgment: 3856,
      verification: 1919,
    },
  },
};

export const MOCK_SAMPLE_TEXT = `안녕하세요, 강남 A피부과입니다.

보톡스 시술 이벤트 안내드립니다!

저희 병원에서 시술받으시면 시술 후 10살은 어려 보입니다.
많은 분들이 만족하고 계세요.

환자 A씨는 "완전히 새 사람이 됐어요"라고 말했습니다.
B씨도 "주변에서 다들 뭐 했냐고 물어봐요"라고 하셨습니다.

이 시술은 100% 안전합니다.
15년 경력의 전문의가 직접 시술합니다.

지금 예약하시면 특별 할인!
☎ 02-1234-5678`;

export const STAGES_ORDER: VerifyStage[] = [
  'keyword_scan',
  'classification',
  'query_rewrite',
  'search',
  'relation_enrichment',
  'judgment',
  'verification',
];
