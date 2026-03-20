/**
 * Approve Affiliate Sale Use Case
 *
 * Approves an affiliate sale and updates affiliate totals.
 */

import { AffiliateSaleStatus } from "../../../modules/affiliates-sales/affiliate-sales.types";

/**
 * Input DTO for ApproveAffiliateSaleUseCase
 */
export interface ApproveAffiliateSaleInput {
  id: string;
}

/**
 * Output DTO for ApproveAffiliateSaleUseCase
 */
export interface ApproveAffiliateSaleOutput {
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
 * Approve Affiliate Sale Use Case
 *
 * Approves an affiliate sale and updates affiliate totals.
 */
export class ApproveAffiliateSaleUseCase {
  /**
   * Execute the use case
   */
  async execute(
    input: ApproveAffiliateSaleInput,
  ): Promise<ApproveAffiliateSaleOutput> {
    const { id } = input;

    // Dynamic import to avoid circular dependencies
    const { findById, updateStatus } =
      await import("../../../modules/affiliates-sales/affiliate-sales.repository");

    // Get the sale first to get the affiliateId and amounts
    const sale = await findById(id);

    // Update status to approved
    const updated = await updateStatus(id, "approved" as AffiliateSaleStatus);

    // Update affiliate's total sales and commissions
    // We'll use the use case instead of service
    const { UpdateAffiliateTotalsUseCase } =
      await import("../affiliate/index.js");
    const updateTotalsUseCase = new UpdateAffiliateTotalsUseCase();
    await updateTotalsUseCase.execute({
      affiliateId: sale.affiliateId,
      saleAmount: sale.saleAmount,
      commissionEarned: sale.commissionEarned,
    });

    return updated;
  }
}
