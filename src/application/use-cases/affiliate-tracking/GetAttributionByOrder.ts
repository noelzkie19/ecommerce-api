import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";

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
  return trackingRepository.getAttributionByOrder(input.orderId);
};
