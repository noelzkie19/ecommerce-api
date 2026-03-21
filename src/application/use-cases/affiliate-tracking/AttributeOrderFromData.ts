import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";
import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";
import { TrackingMethod } from "./index";

export interface AttributeOrderFromDataInput {
  orderId: string;
  affiliateId: string;
  pixelId?: string;
  storeId?: string;
  clickId?: string;
  trackingMethod?: TrackingMethod;
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

export const attributeOrderFromData = async (
  input: AttributeOrderFromDataInput,
): Promise<AttributionData | null> => {
  if (!input.affiliateId || !input.trackingMethod) {
    return null;
  }

  // Validate affiliate exists
  const affiliate = await affiliateRepository.findById(input.affiliateId);

  if (!affiliate || affiliate?.status !== "active") {
    return null;
  }

  // Create attribution in database
  const attribution = await trackingRepository.attributeOrderToAffiliate({
    orderId: input.orderId,
    affiliateId: input.affiliateId,
    trackingMethod: input.trackingMethod || "url_param",
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
