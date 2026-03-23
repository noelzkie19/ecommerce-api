/**
 * IStockRepository Interface
 *
 * Defines the contract for stock data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

export interface StockFilters {
  search?: string;
}

export interface StockStats {
  totalStock: number;
  outOfStock: number;
  lowStock: number;
}

export interface UpdateStockDTO {
  quantity: number;
}

export interface PaginatedStockResult {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Stock repository interface
 * Defines all data access operations for stock
 */
export interface IStockRepository {
  /**
   * Find all stocks with pagination and filters
   */
  findAll(
    filters: StockFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedStockResult>;

  /**
   * Find stock by product ID
   */
  findByProductId(productId: string): Promise<any>;

  /**
   * Upsert stock entry
   */
  upsert(productId: string, dto: UpdateStockDTO): Promise<any>;

  /**
   * Get stock statistics
   */
  getStats(): Promise<StockStats>;
}
