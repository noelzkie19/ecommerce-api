/**
 * IStockRepository Interface
 *
 * Defines the contract for stock data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

import {
  Stock,
  UpdateStockProps,
  PaginatedStocks,
  StockStats,
  StockResponse,
} from "../entities/Stock";

/**
 * Stock repository interface
 * Defines all data access operations for stock management
 */
export interface IStockRepository {
  /**
   * Find all stock entries with pagination and optional search
   */
  findAll(
    filters: { search?: string },
    page: number,
    limit: number,
  ): Promise<PaginatedStocks>;

  /**
   * Find stock by product ID
   */
  findByProductId(productId: string): Promise<Stock | null>;

  /**
   * Create or update stock for a product
   */
  upsert(productId: string, props: UpdateStockProps): Promise<StockResponse>;

  /**
   * Get aggregate stock statistics
   */
  getStats(): Promise<StockStats>;
}
