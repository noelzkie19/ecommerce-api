/**
 * Get Stock Stats Use Case
 *
 * Returns aggregate stock statistics: total, out-of-stock, and low-stock counts.
 */

import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { StockStats } from "../../../domain/entities/Stock";
import { resolve, TOKENS } from "../../../di/container";

export type GetStockStatsOutput = StockStats;

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
