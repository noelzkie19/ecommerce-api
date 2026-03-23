import { resolve } from "../../../di/container";
import { IAffiliateTrackingRepository } from "../../../domain/interfaces/IAffiliateTrackingRepository";

export interface GetTrackingLinkInput {
  id: string;
}

export interface TrackingLinkData {
  id: string;
  affiliateId: string;
  storeId: string;
  campaignName?: string;
  landingPageUrl?: string;
  clickCount: number;
  conversionCount: number;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  affiliate?: {
    id: string;
    name: string;
    email: string;
    pixelId?: string;
  };
}

export const getTrackingLink = async (
  input: GetTrackingLinkInput,
): Promise<TrackingLinkData | null> => {
  const trackingRepo = resolve<IAffiliateTrackingRepository>(
    "IAffiliateTrackingRepository",
  );

  const link = await trackingRepo.getTrackingLink(input.id);

  if (!link) return null;

  return {
    id: link.id,
    affiliateId: link.affiliate_id,
    storeId: link.store_id,
    campaignName: link.campaign_name ?? undefined,
    landingPageUrl: link.landing_page_url ?? undefined,
    clickCount: link.click_count,
    conversionCount: link.conversion_count,
    createdAt: link.created_at,
    expiresAt: link.expires_at ?? undefined,
    isActive: link.is_active,
    affiliate: link.affiliate
      ? {
          id: link.affiliate.id,
          name: link.affiliate.name,
          email: link.affiliate.email,
          pixelId: link.affiliate.pixel_id ?? undefined,
        }
      : undefined,
  };
};
