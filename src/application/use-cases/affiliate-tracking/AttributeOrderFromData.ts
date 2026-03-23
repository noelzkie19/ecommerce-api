import { resolve } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { IAffiliateTrackingRepository } from "../../../domain/interfaces/IAffiliateTrackingRepository";
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

  // Resolve repositories from DI container
  const affiliateRepo = resolve<IAffiliateRepository>("IAffiliateRepository");
  const trackingRepo = resolve<IAffiliateTrackingRepository>(
    "IAffiliateTrackingRepository",
  );

  // Validate affiliate exists
  const affiliate = await affiliateRepo.findById(input.affiliateId);

  if (!affiliate || affiliate.status !== "active") {
    return null;
  }

  // Create attribution in database
  const attribution = await trackingRepo.attributeOrderToAffiliate({
    orderId: input.orderId,
    affiliateId: input.affiliateId,
    trackingMethod: input.trackingMethod || "url_param",
    clickId: input.clickId,
  });

  // Increment conversion count
  if (affiliate.storeId) {
    await trackingRepo.incrementConversionCount(
      input.affiliateId,
      affiliate.storeId,
    );
  }

  return {
    id: attribution.id,
    orderId: attribution.order_id,
    affiliateId: attribution.affiliate_id ?? undefined,
    trackingMethod: attribution.tracking_method,
    pixelId: attribution.pixel_id ?? undefined,
    storeId: attribution.store_id ?? undefined,
    clickId: attribution.click_id ?? undefined,
    referrerUrl: attribution.referrer_url ?? undefined,
    createdAt: attribution.created_at,
  };
};
