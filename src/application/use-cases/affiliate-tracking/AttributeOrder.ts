import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";
import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";
import { AppError } from "../../../common/utils/AppError";

export interface AttributeOrderInput {
  orderId: string;
  affiliateId: string;
  clickId?: string;
}

export interface AttributionData {
  id: string;
  orderId: string;
  affiliateId?: string;
  trackingMethod: string;
  pixelId?: string;
  storeId?: string;
  clickId?: string;
  referrerUrl?: string;
  createdAt: string;
  affiliate?: {
    id: string;
    name: string;
    email: string;
  };
  order?: {
    id: string;
    total: number;
    status: string;
  };
}

export const attributeOrder = async (
  input: AttributeOrderInput,
): Promise<AttributionData> => {
  // Validate affiliate exists
  const affiliate = await affiliateRepository.findById(input.affiliateId);

  if (affiliate.status !== "active") {
    throw new AppError("Cannot attribute order to inactive affiliate", 400);
  }

  // Create attribution in database
  const attribution = await trackingRepository.attributeOrderToAffiliate({
    orderId: input.orderId,
    affiliateId: input.affiliateId,
    trackingMethod: "manual",
    clickId: input.clickId,
  });

  // Increment conversion count
  if (affiliate.store_id) {
    await trackingRepository.incrementConversionCount(
      input.affiliateId,
      affiliate.store_id,
    );
  }

  return attribution;
};
