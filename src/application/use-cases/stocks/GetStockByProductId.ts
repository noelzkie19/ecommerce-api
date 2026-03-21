/**
 * Get Stock By Product ID Use Case
 *
 * Retrieves the stock record for a specific product.
 */

import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { StockResponse } from "../../../domain/entities/Stock";
import { AppError } from "../../../common/utils/AppError";
import { resolve, TOKENS } from "../../../di/container";

export interface GetStockByProductIdInput {
  productId: string;
}

export type GetStockByProductIdOutput = StockResponse;

export class GetStockByProductIdUseCase {
  private readonly stockRepository: IStockRepository;

  constructor(stockRepository?: IStockRepository) {
    this.stockRepository =
      stockRepository ?? resolve<IStockRepository>(TOKENS.IStockRepository);
  }

  async execute(input: GetStockByProductIdInput): Promise<GetStockByProductIdOutput> {
    const stock = await this.stockRepository.findByProductId(input.productId);
    if (!stock) throw new AppError("Stock entry not found", 404);
    return stock.toResponse();
  }
}
