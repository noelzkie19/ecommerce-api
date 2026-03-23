/**
 * Set Affiliate Referrer Use Case
 *
 * Manually sets the referrer for an affiliate (for testing/admin purposes).
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

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
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: SetAffiliateReferrerInput): Promise<void> {
    await this.affiliateRepository.updateReferredBy(
      input.affiliateId,
      input.referrerId,
    );
  }
}
