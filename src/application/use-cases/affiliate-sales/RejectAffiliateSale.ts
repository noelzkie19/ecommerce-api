/**
 * Reject Affiliate Sale Use Case
 *
 * Rejects an affiliate sale.
 */

import { AffiliateSaleStatus } from "../../../modules/affiliates-sales/affiliate-sales.types";

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
  /**
   * Execute the use case
   */
  async execute(
    input: RejectAffiliateSaleInput,
  ): Promise<RejectAffiliateSaleOutput> {
    const { id } = input;

    // Dynamic import to avoid circular dependencies
    const { updateStatus } =
      await import("../../../modules/affiliates-sales/affiliate-sales.repository");

    // Update status to rejected
    const updated = await updateStatus(id, "rejected" as AffiliateSaleStatus);

    return updated;
  }
}
