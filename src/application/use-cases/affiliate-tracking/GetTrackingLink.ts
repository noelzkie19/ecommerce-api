import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";

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
): Promise<TrackingLinkData> => {
  return trackingRepository.getTrackingLink(input.id);
};
