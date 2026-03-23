/**
 * Update Affiliate Sale Status Use Case
 *
 * Updates the status of an affiliate sale.
 */

import {
  IAffiliateSalesRepository,
  AffiliateSaleStatus,
} from "../../../domain/interfaces/IAffiliateSalesRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateAffiliateSaleStatusUseCase
 */
export interface UpdateAffiliateSaleStatusInput {
  id: string;
  status: AffiliateSaleStatus;
}

/**
 * Output DTO for UpdateAffiliateSaleStatusUseCase
 */
export interface UpdateAffiliateSaleStatusOutput {
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
 * Update Affiliate Sale Status Use Case
 *
 * Updates the status of an affiliate sale.
 */
export class UpdateAffiliateSaleStatusUseCase {
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
    input: UpdateAffiliateSaleStatusInput,
  ): Promise<UpdateAffiliateSaleStatusOutput> {
    const { id, status } = input;

    const sale = await this.affiliateSalesRepository.updateStatus(id, status);

    return sale;
  }
}
