/**
 * Supabase Client
 * ⚠️ CLAUDE.md: 이 파일에서만 Supabase 클라이언트 생성
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * 서버 사이드용 Supabase 클라이언트
 * Service Role Key 사용 (RLS 바이패스)
 * Lazy initialization으로 환경변수 로드 타이밍 이슈 해결
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 클라이언트 사이드용 Supabase 클라이언트 (Phase 2)
 * Anon Key 사용 (RLS 적용)
 */
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables for browser client.'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, anonKey);
}
