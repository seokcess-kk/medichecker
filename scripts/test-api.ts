/**
 * API 테스트 스크립트
 * 실행: pnpm tsx scripts/test-api.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

async function testVerifyApi() {
  console.log('='.repeat(60));
  console.log('/api/verify API 테스트');
  console.log('='.repeat(60));

  const testText = `저희 병원 보톡스 시술 후기입니다!
"시술 전에는 이마 주름이 깊었는데 시술 후 완전히 사라졌어요! 정말 강추합니다!"
보톡스 시술, 100% 효과 보장!
지금 예약하시면 50% 할인!`;

  console.log('\n📝 테스트 텍스트:', testText.slice(0, 100) + '...');
  console.log('\n🔄 API 호출 중...\n');

  try {
    const response = await fetch('http://localhost:3003/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: testText,
        adType: 'blog',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP 에러:', response.status);
      console.error('응답:', errorText);
      return;
    }

    if (!response.body) {
      console.error('❌ 응답 스트림 없음');
      return;
    }

    // SSE 스트림 읽기
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    console.log('📡 SSE 이벤트 수신 중...\n');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.slice(6));

          if ('stage' in data && 'status' in data) {
            const icon = data.status === 'done' ? '✅' : '⏳';
            console.log(`${icon} ${data.stage}: ${data.status}`);
          }

          if (data.type === 'result') {
            console.log('\n' + '─'.repeat(60));
            console.log('📊 최종 결과:');
            console.log('─'.repeat(60));

            if (data.data.error) {
              console.error('❌ 에러:', data.data.error);
            } else {
              console.log('위험도:', data.data.riskScore);
              console.log('요약:', data.data.summary);
              console.log('위반 항목:', data.data.violations?.length || 0, '건');

              if (data.data.violations?.length > 0) {
                console.log('\n위반 상세:');
                data.data.violations.forEach((v: Record<string, unknown>, i: number) => {
                  console.log(`  ${i + 1}. [${v.article}] ${v.text}`);
                  console.log(`     확신도: ${v.confidence}%, 수정제안: ${v.suggestion}`);
                });
              }

              console.log('\n메타데이터:', JSON.stringify(data.data.metadata, null, 2));
            }
          }
        } catch (e) {
          console.warn('파싱 오류:', e);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('테스트 완료');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ 네트워크 오류:', error);
  }
}

testVerifyApi();
