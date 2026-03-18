/**
 * Delete Affiliate Use Case
 *
 * Deletes an affiliate by ID.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for DeleteAffiliateUseCase
 */
export interface DeleteAffiliateInput {
  affiliateId: string;
}

/**
 * Delete Affiliate Use Case
 */
export class DeleteAffiliateUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: DeleteAffiliateInput): Promise<void> {
    // Check if affiliate exists
    const affiliate = await this.affiliateRepository.findById(
      input.affiliateId,
    );
    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    await this.affiliateRepository.delete(input.affiliateId);
  }
}
