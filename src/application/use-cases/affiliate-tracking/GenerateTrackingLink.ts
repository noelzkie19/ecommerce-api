import { resolve } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { IAffiliateTrackingRepository } from "../../../domain/interfaces/IAffiliateTrackingRepository";
import { AppError } from "../../../common/utils/AppError";

export interface GenerateTrackingLinkInput {
  affiliateId: string;
  storeId: string;
  campaignName?: string;
  landingPageUrl?: string;
  expiresAt?: string;
}

export interface GenerateTrackingLinkOutput {
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
  trackingUrl: string;
}

export const generateTrackingLink = async (
  input: GenerateTrackingLinkInput,
): Promise<GenerateTrackingLinkOutput> => {
  // Resolve repositories from DI container
  const affiliateRepo = resolve<IAffiliateRepository>("IAffiliateRepository");
  const trackingRepo = resolve<IAffiliateTrackingRepository>(
    "IAffiliateTrackingRepository",
  );

  // Validate affiliate exists
  const affiliate = await affiliateRepo.findById(input.affiliateId);

  if (!affiliate) {
    throw new AppError("Affiliate not found", 404);
  }

  // Check if link already exists
  const existing = await trackingRepo.getTrackingLinkByAffiliate(
    input.affiliateId,
    input.storeId,
    input.campaignName,
  );

  if (existing) {
    // Return existing link with updated info
    const updated = await trackingRepo.updateTrackingLink(existing.id, {
      campaignName: input.campaignName,
      landingPageUrl: input.landingPageUrl,
      expiresAt: input.expiresAt,
    });

    // Generate the full tracking URL
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const trackingUrl = `${baseUrl}?affiliate_id=${affiliate.id}&store_id=${input.storeId}`;

    return {
      id: updated.id,
      affiliateId: updated.affiliate_id,
      storeId: updated.store_id,
      campaignName: updated.campaign_name ?? undefined,
      landingPageUrl: updated.landing_page_url ?? undefined,
      clickCount: updated.click_count,
      conversionCount: updated.conversion_count,
      createdAt: updated.created_at,
      expiresAt: updated.expires_at ?? undefined,
      isActive: updated.is_active,
      trackingUrl,
    };
  }

  // Create new tracking link
  const link = await trackingRepo.createTrackingLink(input);

  // Generate the full tracking URL
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const trackingUrl = `${baseUrl}?affiliate_id=${affiliate.id}&store_id=${input.storeId}`;

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
    trackingUrl,
  };
};
