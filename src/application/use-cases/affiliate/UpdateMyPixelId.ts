/**
 * Update My Pixel ID Use Case
 *
 * Updates the pixel ID for an affiliate.
 */

import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";

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
  pixelId: string;
  createdAt: string;
}

/**
 * Update My Pixel ID Use Case
 */
export class UpdateMyPixelIdUseCase {
  /**
   * Execute the use case
   */
  async execute(input: UpdateMyPixelIdInput): Promise<UpdateMyPixelIdOutput> {
    const affiliate = await affiliateRepository.updatePixelByUserId(
      input.userId,
      input.pixelId,
    );

    return {
      id: affiliate.id,
      status: affiliate.status,
      paymentStatus: affiliate.payment_status,
      email: affiliate.email,
      name: affiliate.name,
      storeId: affiliate.store_id,
      pixelId: affiliate.pixel_id,
      createdAt: affiliate.created_at,
    };
  }
}
