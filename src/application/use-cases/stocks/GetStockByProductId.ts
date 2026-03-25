/**
 * Get Stock By Product ID Use Case
 *
 * Retrieves stock information for a specific product.
 */

import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetStockByProductIdUseCase
 */
export interface GetStockByProductIdInput {
  productId: string;
}

/**
 * Output DTO for GetStockByProductIdUseCase
 */
export interface GetStockByProductIdOutput {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: string;
}

/**
 * Get Stock By Product ID Use Case
 */
export class GetStockByProductIdUseCase {
  private readonly stockRepository: IStockRepository;

  constructor(stockRepository?: IStockRepository) {
    this.stockRepository =
      stockRepository ?? resolve<IStockRepository>(TOKENS.IStockRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: GetStockByProductIdInput,
  ): Promise<GetStockByProductIdOutput | null> {
    const stock = await this.stockRepository.findByProductId(input.productId);

    if (!stock) return null;

    return {
      id: stock.id,
      productId: stock.product_id,
      quantity: stock.quantity,
      updatedAt: stock.updated_at,
    };
  }
}
