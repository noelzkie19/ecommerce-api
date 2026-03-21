/**
 * Update Affiliate Sale Status Use Case
 *
 * Updates the status of an affiliate sale.
 */

/**
 * Status of an affiliate sale
 */
export type AffiliateSaleStatus = "pending" | "approved" | "rejected";

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
  /**
   * Execute the use case
   */
  async execute(
    input: UpdateAffiliateSaleStatusInput,
  ): Promise<UpdateAffiliateSaleStatusOutput> {
    const { id, status } = input;

    // Dynamic import to avoid circular dependencies
    const { updateStatus } =
      await import("../../../modules/affiliates-sales/affiliate-sales.repository");

    const sale = await updateStatus(id, status);

    return sale;
  }
}
