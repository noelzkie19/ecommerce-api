import { resolve } from "../../../di/container";
import { IAffiliateTrackingRepository } from "../../../domain/interfaces/IAffiliateTrackingRepository";

export interface GetAttributionByOrderInput {
  orderId: string;
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

export const getAttributionByOrder = async (
  input: GetAttributionByOrderInput,
): Promise<AttributionData | null> => {
  const trackingRepo = resolve<IAffiliateTrackingRepository>(
    "IAffiliateTrackingRepository",
  );

  const attr = await trackingRepo.getAttributionByOrder(input.orderId);

  if (!attr) return null;

  return {
    id: attr.id,
    orderId: attr.order_id,
    affiliateId: attr.affiliate_id ?? undefined,
    trackingMethod: attr.tracking_method,
    pixelId: attr.pixel_id ?? undefined,
    storeId: attr.store_id ?? undefined,
    clickId: attr.click_id ?? undefined,
    referrerUrl: attr.referrer_url ?? undefined,
    createdAt: attr.created_at,
    affiliate: attr.affiliate
      ? {
          id: attr.affiliate.id,
          name: attr.affiliate.name,
          email: attr.affiliate.email,
        }
      : undefined,
    order: attr.order
      ? {
          id: attr.order.id,
          total: attr.order.total,
          status: attr.order.status,
        }
      : undefined,
  };
};
