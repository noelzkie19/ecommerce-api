/**
 * Update Affiliate Totals Use Case
 *
 * Updates an affiliate's total sales and commissions.
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
    const { affiliateId, saleAmount, commissionEarned } = input;

    const affiliate = await this.affiliateRepository.findById(affiliateId);
    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    const newTotalSales = affiliate.totalSales + saleAmount;
    const newTotalCommissions = affiliate.totalCommissions + commissionEarned;

    await this.affiliateRepository.update(affiliateId, {
      totalSales: newTotalSales,
      totalCommissions: newTotalCommissions,
    });
  }
}
