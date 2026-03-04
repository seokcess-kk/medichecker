#!/bin/bash
# Skill Activation Prompt Hook
# 사용자 프롬프트를 분석하여 관련 스킬을 자동 활성화

# skill-rules.json 경로
RULES_FILE="$CLAUDE_PROJECT_DIR/.claude/skills/skill-rules.json"

# 프롬프트에서 키워드 매칭 (간단 버전)
# 실제 구현에서는 jq로 JSON 파싱하여 정교한 매칭 수행

echo "[Skill Activation] Checking relevant skills..."
echo "📚 참조: .claude/skills/skill-rules.json"
