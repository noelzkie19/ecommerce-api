import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";
import { PaginationMeta } from "../../../common/types";

export interface GetAttributionsInput {
  affiliateId: string;
  page?: number;
  limit?: number;
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

export interface GetAttributionsOutput {
  data: AttributionData[];
  meta: PaginationMeta;
}

export const getAttributions = async (
  input: GetAttributionsInput,
): Promise<GetAttributionsOutput> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  return trackingRepository.getAttributionsByAffiliate(
    input.affiliateId,
    page,
    limit,
  );
};
