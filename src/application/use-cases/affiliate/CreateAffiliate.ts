/**
 * Create Affiliate Use Case
 *
 * Creates a new affiliate.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { CreateAffiliateProps } from "../../../domain/entities/Affiliate";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for CreateAffiliateUseCase
 */
export interface CreateAffiliateInput {
  userId: string;
  email: string;
  name: string;
  referredBy?: string;
}

/**
 * Output DTO for CreateAffiliateUseCase
 */
export interface CreateAffiliateOutput {
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
 * Create Affiliate Use Case
 */
export class CreateAffiliateUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: CreateAffiliateInput): Promise<CreateAffiliateOutput> {
    const affiliateProps: CreateAffiliateProps = {
      id: crypto.randomUUID(),
      userId: input.userId,
      email: input.email,
      name: input.name,
      referredBy: input.referredBy,
    };

    const affiliate = await this.affiliateRepository.create(affiliateProps);
    return affiliate.toResponse();
  }
}
