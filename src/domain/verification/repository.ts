/**
 * Verification Domain - Repository
 * 검증 결과 저장/조회 (Phase 2: 이력 저장 시 구현)
 */

import type { VerifyResult } from './model';

export class VerificationRepository {
  // Phase 2: 검증 이력 저장
  async save(_result: VerifyResult): Promise<void> {
    // TODO: Implement in Phase 2
  }

  // Phase 2: 검증 이력 조회
  async findById(_id: string): Promise<VerifyResult | null> {
    // TODO: Implement in Phase 2
    return null;
  }
}

export const verificationRepository = new VerificationRepository();
