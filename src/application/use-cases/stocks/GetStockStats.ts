/**
 * Get Stock Stats Use Case
 *
 * Returns aggregate stock statistics: total, out-of-stock, and low-stock counts.
 */

import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { resolve, TOKENS } from "../../../di/container";

export interface GetStockStatsOutput {
  totalStock: number;
  outOfStock: number;
  lowStock: number;
}

export class GetStockStatsUseCase {
  private readonly stockRepository: IStockRepository;

  constructor(stockRepository?: IStockRepository) {
    this.stockRepository =
      stockRepository ?? resolve<IStockRepository>(TOKENS.IStockRepository);
  }

  async execute(): Promise<GetStockStatsOutput> {
    return this.stockRepository.getStats();
  }
}
