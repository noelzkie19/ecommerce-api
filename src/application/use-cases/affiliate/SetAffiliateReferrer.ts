/**
 * Set Affiliate Referrer Use Case
 *
 * Manually sets the referrer for an affiliate (for testing/admin purposes).
 */

import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";

/**
 * Input DTO for SetAffiliateReferrerUseCase
 */
export interface SetAffiliateReferrerInput {
  affiliateId: string;
  referrerId: string;
}

/**
 * Set Affiliate Referrer Use Case
 */
export class SetAffiliateReferrerUseCase {
  /**
   * Execute the use case
   */
  async execute(input: SetAffiliateReferrerInput): Promise<void> {
    await affiliateRepository.updateReferredBy(
      input.affiliateId,
      input.referrerId,
    );
  }
}
