/**
 * Get Affiliate Sale Use Case
 *
 * Retrieves a single affiliate sale by ID.
 */

/**
 * Input DTO for GetAffiliateSaleUseCase
 */
export interface GetAffiliateSaleInput {
  id: string;
}

/**
 * Output DTO for GetAffiliateSaleUseCase
 */
export interface GetAffiliateSaleOutput {
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
 * Get Affiliate Sale Use Case
 *
 * Retrieves a single affiliate sale by ID.
 */
export class GetAffiliateSaleUseCase {
  /**
   * Execute the use case
   */
  async execute(input: GetAffiliateSaleInput): Promise<GetAffiliateSaleOutput> {
    const { id } = input;

    // Dynamic import to avoid circular dependencies
    const { findById } =
      await import("../../../modules/affiliates-sales/affiliate-sales.repository");

    const sale = await findById(id);

    return sale;
  }
}
