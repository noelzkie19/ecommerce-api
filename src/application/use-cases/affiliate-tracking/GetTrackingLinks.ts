import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";
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

  return trackingRepository.getTrackingLinksByAffiliate(
    input.affiliateId,
    page,
    limit,
  );
};
