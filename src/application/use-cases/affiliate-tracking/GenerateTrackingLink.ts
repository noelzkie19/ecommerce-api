import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";
import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";

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
  // Validate affiliate exists
  const affiliate = await affiliateRepository.findById(input.affiliateId);

  // Check if link already exists
  const existing = await trackingRepository.getTrackingLinkByAffiliate(
    input.affiliateId,
    input.storeId,
    input.campaignName,
  );

  if (existing) {
    // Return existing link with updated info
    const updated = await trackingRepository.updateTrackingLink(existing.id, {
      campaignName: input.campaignName,
      landingPageUrl: input.landingPageUrl,
      expiresAt: input.expiresAt,
    });

    // Generate the full tracking URL
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const trackingUrl = `${baseUrl}?affiliate_id=${affiliate.id}&store_id=${input.storeId}`;

    return {
      ...updated,
      trackingUrl,
    };
  }

  // Create new tracking link
  const link = await trackingRepository.createTrackingLink(input);

  // Generate the full tracking URL
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const trackingUrl = `${baseUrl}?affiliate_id=${affiliate.id}&store_id=${input.storeId}`;

  return {
    ...link,
    trackingUrl,
  };
};
