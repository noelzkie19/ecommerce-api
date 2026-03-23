/**
 * Update Affiliate Use Case
 *
 * Updates an existing affiliate.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { CreateAffiliateProps } from "../../../domain/entities/Affiliate";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateAffiliateUseCase
 */
export interface UpdateAffiliateInput {
  affiliateId: string;
  name?: string;
  email?: string;
  status?: "pending" | "active" | "suspended";
  paymentStatus?: "paid" | "unpaid";
  pixelId?: string | null;
  storeId?: string | null;
  affiliateLink?: string | null;
}

/**
 * Output DTO for UpdateAffiliateUseCase
 */
export interface UpdateAffiliateOutput {
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
 * Update Affiliate Use Case
 */
export class UpdateAffiliateUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: UpdateAffiliateInput): Promise<UpdateAffiliateOutput> {
    const updateData: Partial<CreateAffiliateProps> = {
      name: input.name,
      email: input.email,
      status: input.status,
      paymentStatus: input.paymentStatus,
      pixelId: input.pixelId,
      storeId: input.storeId,
      affiliateLink: input.affiliateLink,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof CreateAffiliateProps] === undefined) {
        delete updateData[key as keyof CreateAffiliateProps];
      }
    });

    const affiliate = await this.affiliateRepository.update(
      input.affiliateId,
      updateData,
    );
    return affiliate.toResponse();
  }
}
