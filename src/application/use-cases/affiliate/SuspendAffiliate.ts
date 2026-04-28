/**
 * Suspend Affiliate Use Case
 *
 * Suspends an affiliate.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for SuspendAffiliateUseCase
 */
export interface SuspendAffiliateInput {
  affiliateId: string;
}

/**
 * Output DTO for SuspendAffiliateUseCase
 */
export interface SuspendAffiliateOutput {
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
 * Suspend Affiliate Use Case
 */
export class SuspendAffiliateUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: SuspendAffiliateInput): Promise<SuspendAffiliateOutput> {
    const affiliate = await this.affiliateRepository.findById(
      input.affiliateId,
    );

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    const suspended = affiliate.suspend();

    // Update in repository
    await this.affiliateRepository.update(input.affiliateId, {
      status: "suspended",
    });

    return suspended.toResponse();
  }
}
