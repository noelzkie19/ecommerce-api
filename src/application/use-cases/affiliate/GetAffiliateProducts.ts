/**
 * Get Affiliate Products Use Case
 *
 * Gets all products assigned to an affiliate.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetAffiliateProductsUseCase
 */
export interface GetAffiliateProductsInput {
  affiliateId: string;
}

/**
 * Output DTO for GetAffiliateProductsUseCase
 */
export interface GetAffiliateProductsOutput {
  id: string;
  affiliateId: string;
  productId: string;
  commissionType: string;
  commissionValue: number;
  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
  };
}

/**
 * Get Affiliate Products Use Case
 */
export class GetAffiliateProductsUseCase {
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
    input: GetAffiliateProductsInput,
  ): Promise<GetAffiliateProductsOutput[]> {
    return this.affiliateRepository.findProductsByAffiliate(input.affiliateId);
  }
}
