/**
 * /api/health - 환경변수 및 연결 상태 확인
 */

import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    // 키 일부만 표시 (보안)
    ANTHROPIC_KEY_PREFIX: process.env.ANTHROPIC_API_KEY?.substring(0, 10) || 'NOT_SET',
  };

  // Anthropic API 테스트
  let anthropicTest = { status: 'not_tested', error: null as string | null };
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });
    anthropicTest = { status: 'ok', error: null };
  } catch (error) {
    anthropicTest = {
      status: 'error',
      error: error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error'
    };
  }

  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: envCheck,
    anthropicTest,
  });
}
