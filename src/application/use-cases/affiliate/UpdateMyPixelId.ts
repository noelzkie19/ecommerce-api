/**
 * Update My Pixel ID Use Case
 *
 * Updates the pixel ID for an affiliate.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateMyPixelIdUseCase
 */
export interface UpdateMyPixelIdInput {
  userId: string;
  pixelId: string;
}

/**
 * Output DTO for UpdateMyPixelIdUseCase
 */
export interface UpdateMyPixelIdOutput {
  id: string;
  status: string;
  paymentStatus: string;
  email: string;
  name: string;
  storeId: string | null;
  pixelId: string | null;
  createdAt: string | null;
}

/**
 * Update My Pixel ID Use Case
 */
export class UpdateMyPixelIdUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: UpdateMyPixelIdInput): Promise<UpdateMyPixelIdOutput> {
    const affiliate = await this.affiliateRepository.updatePixelByUserId(
      input.userId,
      input.pixelId,
    );

    return {
      id: affiliate.id,
      status: affiliate.status,
      paymentStatus: affiliate.paymentStatus,
      email: affiliate.email,
      name: affiliate.name,
      storeId: affiliate.storeId,
      pixelId: affiliate.pixelId,
      createdAt:
        affiliate.createdAt instanceof Date
          ? affiliate.createdAt.toISOString()
          : affiliate.createdAt,
    };
  }
}
