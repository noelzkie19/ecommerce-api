/**
 * List Affiliates Use Case
 *
 * Retrieves a paginated list of affiliates.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { AffiliateStatus } from "../../../domain/entities/Affiliate";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ListAffiliatesUseCase
 */
export interface ListAffiliatesInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: AffiliateStatus;
}

/**
 * Output DTO for ListAffiliatesUseCase
 */
export interface ListAffiliatesOutput {
  data: Array<{
    id: string;
    userId: string;
    email: string;
    name: string;
    status: string;
    paymentStatus: string;
    affiliateLink: string | null;
    storeId: string | null;
    pixelId: string | null;
    referredBy: string | null;
    totalSales: number;
    totalCommissions: number;
    affiliateCommission: number;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * List Affiliates Use Case
 *
 * Retrieves a paginated list of affiliates.
 */
export class ListAffiliatesUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: ListAffiliatesInput = {},
  ): Promise<ListAffiliatesOutput> {
    const { page = 1, limit = 20, search, status } = input;

    const result = await this.affiliateRepository.findAllPaginated(
      page,
      limit,
      search,
      status,
    );

    return {
      data: result.data.map((affiliate) => affiliate.toResponse()),
      meta: result.meta,
    };
  }
}
