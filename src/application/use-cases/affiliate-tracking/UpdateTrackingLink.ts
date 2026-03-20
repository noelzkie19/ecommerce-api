import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";

export interface UpdateTrackingLinkInput {
  id: string;
  campaignName?: string;
  landingPageUrl?: string;
  expiresAt?: string;
  isActive?: boolean;
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

export const updateTrackingLink = async (
  input: UpdateTrackingLinkInput,
): Promise<TrackingLinkData> => {
  return trackingRepository.updateTrackingLink(input.id, {
    campaignName: input.campaignName,
    landingPageUrl: input.landingPageUrl,
    expiresAt: input.expiresAt,
    isActive: input.isActive,
  });
};
