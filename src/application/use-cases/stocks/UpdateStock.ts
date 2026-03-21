/**
 * Update Stock Use Case
 *
 * Creates or updates the stock quantity for a product (upsert).
 */

import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { StockResponse } from "../../../domain/entities/Stock";
import { resolve, TOKENS } from "../../../di/container";

export interface UpdateStockInput {
  productId: string;
  quantity: number;
}

export type UpdateStockOutput = StockResponse;

export class UpdateStockUseCase {
  private readonly stockRepository: IStockRepository;

  constructor(stockRepository?: IStockRepository) {
    this.stockRepository =
      stockRepository ?? resolve<IStockRepository>(TOKENS.IStockRepository);
  }

  async execute(input: UpdateStockInput): Promise<UpdateStockOutput> {
    return this.stockRepository.upsert(input.productId, {
      quantity: input.quantity,
    });
  }
}
