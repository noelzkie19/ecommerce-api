/**
 * Update Stock Use Case (Admin)
 *
 * Updates the stock quantity for a product.
 */

import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateStockUseCase
 */
export interface UpdateStockInput {
  productId: string;
  quantity: number;
}

/**
 * Output DTO for UpdateStockUseCase
 */
export interface UpdateStockOutput {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: string;
}

/**
 * Update Stock Use Case (Admin)
 */
export class UpdateStockUseCase {
  private readonly stockRepository: IStockRepository;

  constructor(stockRepository?: IStockRepository) {
    this.stockRepository =
      stockRepository ?? resolve<IStockRepository>(TOKENS.IStockRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: UpdateStockInput): Promise<UpdateStockOutput> {
    const updated = await this.stockRepository.upsert(input.productId, {
      quantity: input.quantity,
    });

    return {
      id: updated.id,
      productId: updated.product_id,
      quantity: updated.quantity,
      updatedAt: updated.updated_at,
    };
  }
}
