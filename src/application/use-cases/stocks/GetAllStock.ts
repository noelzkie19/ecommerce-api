/**
 * Get All Stock Use Case (Admin)
 *
 * Retrieves all stock entries with pagination and filters.
 */

import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetAllStockUseCase
 */
export interface GetAllStockInput {
  search?: string;
  page: number;
  limit: number;
}

/**
 * Output DTO for GetAllStockUseCase
 */
export interface GetAllStockOutput {
  stock: any[];
  stats: {
    totalStock: number;
    outOfStock: number;
    lowStock: number;
  };
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get All Stock Use Case (Admin)
 */
export class GetAllStockUseCase {
  private readonly stockRepository: IStockRepository;

  constructor(stockRepository?: IStockRepository) {
    this.stockRepository =
      stockRepository ?? resolve<IStockRepository>(TOKENS.IStockRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetAllStockInput): Promise<GetAllStockOutput> {
    const [{ data, meta }, stats] = await Promise.all([
      this.stockRepository.findAll(
        { search: input.search },
        input.page,
        input.limit,
      ),
      this.stockRepository.getStats(),
    ]);

    return { stock: data, stats, meta };
  }
}
