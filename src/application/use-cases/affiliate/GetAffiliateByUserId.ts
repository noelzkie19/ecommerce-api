/**
 * Get Affiliate By User ID Use Case
 *
 * Retrieves an affiliate by their user ID.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetAffiliateByUserIdUseCase
 */
export interface GetAffiliateByUserIdInput {
  userId: string;
}

/**
 * Output DTO for GetAffiliateByUserIdUseCase
 */
export interface GetAffiliateByUserIdOutput {
  id: string;
  userId: string;
  email: string;
  name: string;
  status: string;
  paymentStatus: string;
  affiliateLink: string | null;
  storeId: string | null;
  pixelId: string | null;
  referredBy: string | null;
  totalSales: number;
  totalCommissions: number;
  affiliateCommission: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Get Affiliate By User ID Use Case
 */
export class GetAffiliateByUserIdUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: GetAffiliateByUserIdInput,
  ): Promise<GetAffiliateByUserIdOutput | null> {
    const affiliate = await this.affiliateRepository.findByUserId(input.userId);

    if (!affiliate) {
      return null;
    }

    return affiliate.toResponse();
  }
}
