/**
 * IAffiliateSalesRepository Interface
 *
 * Defines the contract for affiliate sales data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

/**
 * Affiliate sale status
 */
export type AffiliateSaleStatus = "pending" | "approved" | "rejected";

/**
 * Commission type
 */
export type CommissionType = "percentage" | "fixed";

/**
 * Affiliate sale data
 */
export interface AffiliateSale {
  id: string;
  affiliateId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  saleAmount: number;
  commissionType: CommissionType;
  commissionValue: number;
  commissionEarned: number;
  status: AffiliateSaleStatus;
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
 * Pagination meta
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paginated affiliate sales
 */
export interface PaginatedAffiliateSales {
  data: AffiliateSale[];
  meta: PaginationMeta;
}

/**
 * Affiliate sales repository interface
 * Defines all data access operations for affiliate sales
 */
export interface IAffiliateSalesRepository {
  /**
   * Find all affiliate sales with pagination
   */
  findAllPaginated(
    page: number,
    limit: number,
    affiliateId?: string,
    status?: AffiliateSaleStatus,
    search?: string,
  ): Promise<PaginatedAffiliateSales>;

  /**
   * Find affiliate sale by ID
   */
  findById(id: string): Promise<AffiliateSale | null>;

  /**
   * Update affiliate sale status
   */
  updateStatus(id: string, status: AffiliateSaleStatus): Promise<AffiliateSale>;

  /**
   * Delete affiliate sale
   */
  delete(id: string): Promise<void>;

  /**
   * Record sales for a confirmed/delivered order
   */
  recordSalesForOrder(orderId: string): Promise<void>;

  /**
   * Get aggregated sales totals per affiliate for a given order.
   * Used to update affiliate totals after recording sales.
   */
  getSalesSummaryByOrder(
    orderId: string,
  ): Promise<
    { affiliateId: string; totalSaleAmount: number; totalCommission: number }[]
  >;
}
