/**
 * Remove Product from Affiliate Use Case
 *
 * Removes a product assignment from an affiliate.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for RemoveProductUseCase
 */
export interface RemoveProductInput {
  affiliateId: string;
  productId: string;
}

/**
 * Remove Product Use Case
 */
export class RemoveProductUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: RemoveProductInput): Promise<void> {
    await this.affiliateRepository.removeProduct(
      input.affiliateId,
      input.productId,
    );
  }
}
