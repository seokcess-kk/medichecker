---
name: ui-design
description: "UI 컴포넌트 및 사용자 경험 설계 시 필수 참조"
---

# UI 디자인 스킬

## Purpose
MediChecker의 사용자 인터페이스를 일관성 있고 직관적으로 구현한다.
검증 결과를 명확하게 전달하여 사용자가 즉시 조치를 취할 수 있도록 한다.

## When to Use
- React 컴포넌트 작성 시
- 결과 화면 UI 설계 시
- SSE 진행 표시 구현 시

## Quick Reference

### 핵심 컴포넌트 8개
```
TextInput.tsx         → 광고 텍스트 입력
AdTypeSelector.tsx    → 광고 유형 선택 (블로그/인스타/유튜브/기타)
VerifyButton.tsx      → 검증 시작 버튼
ResultPanel.tsx       → 결과 컨테이너
RiskScore.tsx         → 위험도 게이지 (0~100)
ViolationHighlight.tsx → 위반 표현 하이라이트
ViolationItem.tsx     → 위반 항목 상세
ProgressIndicator.tsx → 단계별 진행 표시
```

### 위험도 색상 체계
| 확신도 | 색상 | 의미 |
|--------|------|------|
| 90%+ | 빨강 (#EF4444) | 높은 위반 가능성 |
| 60~89% | 노랑 (#F59E0B) | 주의 필요 |
| 40~59% | 회색 (#9CA3AF) | 검토 권장 |
| <40% | - | 표시 안함 |

### 진행 표시 흐름
```
키워드 스캔 ✓ → 분류 완료 ✓ → 법령 검색 ✓
→ 관계 분석 ✓ → AI 판단 중... → 검증 완료 ✓
```

### 레이아웃
```
┌─────────────────┬─────────────────┐
│  텍스트 입력     │   결과 패널      │
│  (왼쪽 50%)     │   (오른쪽 50%)   │
│  - 광고 유형     │   - 위험도 점수   │
│  - 텍스트 영역   │   - 위반 하이라이트│
│  - 검증 버튼     │   - 상세 목록     │
└─────────────────┴─────────────────┘
```

## ✅ DO
- Tailwind CSS 4.x 유틸리티 클래스 사용
- RSC(React Server Components) 활용
- SSE로 진행 상태 실시간 업데이트
- 면책 조항 하단에 항상 표시

## ❌ DON'T
- 확신도 100% 표시 금지 (법적 불확실성 반영)
- 검증 중 결과 미리 표시 금지
- 복잡한 애니메이션 지양 (심플 우선)
- 법률 자문 대체 표현 금지

## 면책 조항 (필수)
```
MediChecker는 AI 기반 사전검증 보조 도구이며,
법률 자문을 대체하지 않습니다.
최종 판단은 의료법 전문가의 검토를 받으시기 바랍니다.
```

## Resource Files
- [component-specs.md](resources/component-specs.md) - 컴포넌트 상세 스펙
- [color-system.md](resources/color-system.md) - 색상 체계
