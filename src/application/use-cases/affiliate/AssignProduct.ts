/**
 * Assign Product to Affiliate Use Case
 *
 * Assigns a product to an affiliate with commission settings.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for AssignProductUseCase
 */
export interface AssignProductInput {
  affiliateId: string;
  productId: string;
  commissionType: "percentage" | "fixed";
  commissionValue: number;
}

/**
 * Output DTO for AssignProductUseCase
 */
export interface AssignProductOutput {
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
 * Assign Product Use Case
 */
export class AssignProductUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: AssignProductInput): Promise<AssignProductOutput> {
    // Validate commission value
    if (input.commissionValue <= 0) {
      throw new Error("Commission value must be greater than 0");
    }
    if (input.commissionType === "percentage" && input.commissionValue > 100) {
      throw new Error("Percentage commission cannot exceed 100");
    }

    // Check if affiliate exists
    const affiliate = await this.affiliateRepository.findById(
      input.affiliateId,
    );
    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    const result = await this.affiliateRepository.assignProduct(
      input.affiliateId,
      input.productId,
      input.commissionType,
      input.commissionValue,
    );

    return result;
  }
}
