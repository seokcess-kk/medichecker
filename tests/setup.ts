/**
 * Vitest 테스트 설정
 */

import { config } from 'dotenv';

// .env.local 로드
config({ path: '.env.local' });

// 환경변수 검증
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Missing env var: ${envVar}`);
  }
}
