/**
 * /api/embed - 임베딩 API 엔드포인트
 * 텍스트 임베딩 생성 (시드 스크립트용)
 */

import { NextRequest } from 'next/server';
import { embeddingProvider } from '@/lib/embedding';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 단일 텍스트
    if (typeof body.text === 'string') {
      const embedding = await embeddingProvider.embed(body.text);
      return Response.json({ embedding });
    }

    // 배치 텍스트
    if (Array.isArray(body.texts)) {
      const embeddings = await embeddingProvider.embedBatch(body.texts);
      return Response.json({ embeddings });
    }

    return Response.json(
      { error: 'text (string) or texts (array) is required' },
      { status: 400 }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
