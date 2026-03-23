/**
 * List Affiliate Sales Use Case
 *
 * Retrieves a paginated list of affiliate sales.
 */

import {
  IAffiliateSalesRepository,
  AffiliateSaleStatus,
} from "../../../domain/interfaces/IAffiliateSalesRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ListAffiliateSalesUseCase
 */
export interface ListAffiliateSalesInput {
  page?: number;
  limit?: number;
  affiliateId?: string;
  status?: AffiliateSaleStatus;
  search?: string;
}

/**
 * Output DTO for ListAffiliateSalesUseCase
 */
export interface ListAffiliateSalesOutput {
  data: Array<{
    id: string;
    affiliateId: string;
    orderId: string;
    orderItemId: string;
    productId: string;
    quantity: number;
    saleAmount: number;
    commissionType: string;
    commissionValue: number;
    commissionEarned: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    affiliate?: { id: string; name: string; email: string };
    product?: {
      id: string;
      name: string;
      price: number;
      image_url: string | null;
    };
    order?: { id: string; status: string; created_at: string };
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * List Affiliate Sales Use Case
 *
 * Retrieves a paginated list of affiliate sales.
 */
export class ListAffiliateSalesUseCase {
  private readonly affiliateSalesRepository: IAffiliateSalesRepository;

  constructor(affiliateSalesRepository?: IAffiliateSalesRepository) {
    this.affiliateSalesRepository =
      affiliateSalesRepository ??
      resolve<IAffiliateSalesRepository>(TOKENS.IAffiliateSalesRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: ListAffiliateSalesInput = {},
  ): Promise<ListAffiliateSalesOutput> {
    const { page = 1, limit = 20, affiliateId, status, search } = input;

    const result = await this.affiliateSalesRepository.findAllPaginated(
      page,
      limit,
      affiliateId,
      status,
      search,
    );

    return {
      data: result.data,
      meta: result.meta,
    };
  }
}
