/**
 * Activate Affiliate Use Case
 *
 * Activates an affiliate.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ActivateAffiliateUseCase
 */
export interface ActivateAffiliateInput {
  affiliateId: string;
}

/**
 * Output DTO for ActivateAffiliateUseCase
 */
export interface ActivateAffiliateOutput {
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Activate Affiliate Use Case
 */
export class ActivateAffiliateUseCase {
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
    input: ActivateAffiliateInput,
  ): Promise<ActivateAffiliateOutput> {
    const affiliate = await this.affiliateRepository.findById(
      input.affiliateId,
    );

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    if (!affiliate.canBeActivated()) {
      throw new Error(
        "Affiliate cannot be activated. Payment may not be completed.",
      );
    }

    const activated = affiliate.activate();

    // Update in repository
    await this.affiliateRepository.update(input.affiliateId, {
      status: "active",
    });

    return activated.toResponse();
  }
}
