/**
 * Reject Affiliate Sale Use Case
 *
 * Rejects an affiliate sale.
 */

import { IAffiliateSalesRepository } from "../../../domain/interfaces/IAffiliateSalesRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for RejectAffiliateSaleUseCase
 */
export interface RejectAffiliateSaleInput {
  id: string;
}

/**
 * Output DTO for RejectAffiliateSaleUseCase
 */
export interface RejectAffiliateSaleOutput {
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
}

/**
 * Reject Affiliate Sale Use Case
 *
 * Rejects an affiliate sale.
 */
export class RejectAffiliateSaleUseCase {
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
    input: RejectAffiliateSaleInput,
  ): Promise<RejectAffiliateSaleOutput> {
    const { id } = input;

    // Update status to rejected
    const updated = await this.affiliateSalesRepository.updateStatus(
      id,
      "rejected",
    );

    return updated;
  }
}
