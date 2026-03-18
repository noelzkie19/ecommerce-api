/**
 * Update Affiliate Totals Use Case
 *
 * Updates an affiliate's sales and commissions totals.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateAffiliateTotalsUseCase
 */
export interface UpdateAffiliateTotalsInput {
  affiliateId: string;
  saleAmount: number;
  commissionEarned: number;
}

/**
 * Update Affiliate Totals Use Case
 */
export class UpdateAffiliateTotalsUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: UpdateAffiliateTotalsInput): Promise<void> {
    await this.affiliateRepository.updateTotals(
      input.affiliateId,
      input.saleAmount,
      input.commissionEarned,
    );
  }
}
