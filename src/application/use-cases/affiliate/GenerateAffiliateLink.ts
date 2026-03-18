/**
 * Generate Affiliate Link Use Case
 *
 * Generates an affiliate link for a user.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GenerateAffiliateLinkUseCase
 */
export interface GenerateAffiliateLinkInput {
  userId: string;
}

/**
 * Output DTO for GenerateAffiliateLinkUseCase
 */
export interface GenerateAffiliateLinkOutput {
  affiliateLink: string;
  affiliateLinkCode: string;
}

/**
 * Generate Affiliate Link Use Case
 */
export class GenerateAffiliateLinkUseCase {
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
    input: GenerateAffiliateLinkInput,
  ): Promise<GenerateAffiliateLinkOutput> {
    const linkCode = await this.affiliateRepository.generateAndSetAffiliateLink(
      input.userId,
    );

    if (!linkCode) {
      throw new Error("Failed to generate affiliate link");
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const affiliateLink = `${frontendUrl}/register?ref=${linkCode}`;

    return {
      affiliateLink,
      affiliateLinkCode: linkCode,
    };
  }
}
