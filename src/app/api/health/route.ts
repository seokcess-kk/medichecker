/**
 * /api/health - 환경변수 및 연결 상태 확인
 */

export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    // 키 일부만 표시 (보안)
    ANTHROPIC_KEY_PREFIX: process.env.ANTHROPIC_API_KEY?.substring(0, 10) || 'NOT_SET',
  };

  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: envCheck,
  });
}
