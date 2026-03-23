import { resolve } from "../../../di/container";
import { IAffiliatePixelRepository } from "../../../domain/interfaces/IAffiliatePixelRepository";
import { PaginationMeta } from "../../../common/types";

export interface GetPixelEventsInput {
  affiliateId: string;
  page?: number;
  limit?: number;
}

export interface PixelEventData {
  id: string;
  affiliateId?: string;
  orderId?: string;
  eventType: string;
  pixelId: string;
  eventId: string;
  eventData?: Record<string, unknown>;
  status: string;
  metaResponse?: Record<string, unknown>;
  retryCount: number;
  createdAt: string;
  sentAt?: string;
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

export interface GetPixelEventsOutput {
  data: PixelEventData[];
  meta: PaginationMeta;
}

export const getPixelEvents = async (
  input: GetPixelEventsInput,
): Promise<GetPixelEventsOutput> => {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  // Resolve repository from DI container
  const pixelRepository = resolve<IAffiliatePixelRepository>(
    "IAffiliatePixelRepository",
  );

  return pixelRepository.getPixelEventsByAffiliate(
    input.affiliateId,
    page,
    limit,
  );
};
