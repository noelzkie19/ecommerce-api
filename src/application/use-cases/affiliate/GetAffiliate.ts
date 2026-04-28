/**
 * Get Affiliate Use Case
 *
 * Retrieves an affiliate by their ID.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetAffiliateUseCase
 */
export interface GetAffiliateInput {
  affiliateId: string;
}

/**
 * Output DTO for GetAffiliateUseCase
 */
export interface GetAffiliateOutput {
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
  paymentProofUrl: string | null;
  paymentProofRef: string | null;
  paymentProofSubmittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Get Affiliate Use Case
 *
 * Retrieves an affiliate by their ID.
 */
export class GetAffiliateUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetAffiliateInput): Promise<GetAffiliateOutput | null> {
    const affiliate = await this.affiliateRepository.findById(
      input.affiliateId,
    );

    if (!affiliate) {
      return null;
    }

    return affiliate.toResponse();
  }
}
