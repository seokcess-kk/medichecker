#!/bin/bash
# Post Tool Use Tracker Hook
# 파일 수정 후 변경 사항 추적

# 수정된 파일 목록 기록
TRACKER_FILE="$CLAUDE_PROJECT_DIR/dev/active/mvp/.modified-files.log"

# 현재 시간과 함께 기록
echo "[$(date '+%Y-%m-%d %H:%M:%S')] File modified: $CLAUDE_TOOL_FILE" >> "$TRACKER_FILE"

echo "[Tracker] 변경 사항 기록됨"
