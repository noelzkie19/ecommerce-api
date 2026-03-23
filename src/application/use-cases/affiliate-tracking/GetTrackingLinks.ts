import { resolve } from "../../../di/container";
import { IAffiliateTrackingRepository } from "../../../domain/interfaces/IAffiliateTrackingRepository";
import { PaginationMeta } from "../../../common/types";

export interface GetTrackingLinksInput {
  affiliateId: string;
  page?: number;
  limit?: number;
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

export interface GetTrackingLinksOutput {
  data: TrackingLinkData[];
  meta: PaginationMeta;
}

export const getTrackingLinks = async (
  input: GetTrackingLinksInput,
): Promise<GetTrackingLinksOutput> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  // Resolve repository from DI container
  const trackingRepo = resolve<IAffiliateTrackingRepository>(
    "IAffiliateTrackingRepository",
  );

  const result = await trackingRepo.getTrackingLinksByAffiliate(
    input.affiliateId,
    page,
    limit,
  );

  return {
    data: result.data.map((link) => ({
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
    })),
    meta: result.meta,
  };
};
