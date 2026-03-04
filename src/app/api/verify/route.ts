/**
 * /api/verify - 검증 API 엔드포인트
 * SSE로 단계별 진행 상태 전송
 */

import { NextRequest } from 'next/server';
import { verificationService } from '@/domain/verification/service';
import type { VerifyRequest, VerifyProgress } from '@/domain/verification/model';

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();

    // 입력 검증
    if (!body.text || typeof body.text !== 'string') {
      return Response.json(
        { error: 'text is required' },
        { status: 400 }
      );
    }

    if (!body.adType || !['blog', 'instagram', 'youtube', 'other'].includes(body.adType)) {
      return Response.json(
        { error: 'valid adType is required' },
        { status: 400 }
      );
    }

    // SSE 스트림 생성
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: VerifyProgress | { type: 'result'; data: unknown }) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // 파이프라인 실행
          const result = await verificationService.verify(
            body,
            (progress) => sendEvent(progress)
          );

          // 최종 결과
          sendEvent({ type: 'result', data: result });
        } catch (error) {
          console.error('Pipeline error:', error);
          sendEvent({
            type: 'result',
            data: {
              error: error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
            },
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
