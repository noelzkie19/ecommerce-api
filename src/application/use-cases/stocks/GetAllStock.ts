/**
 * Get All Stock Use Case
 *
 * Lists all stock entries with pagination and optional search filter.
 */

import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { PaginatedStocks } from "../../../domain/entities/Stock";
import { resolve, TOKENS } from "../../../di/container";

export interface GetAllStockInput {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetAllStockOutput {
  stock: PaginatedStocks["data"];
  meta: PaginatedStocks["meta"];
}

export class GetAllStockUseCase {
  private readonly stockRepository: IStockRepository;

  constructor(stockRepository?: IStockRepository) {
    this.stockRepository =
      stockRepository ?? resolve<IStockRepository>(TOKENS.IStockRepository);
  }

  async execute(input: GetAllStockInput): Promise<GetAllStockOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    const result = await this.stockRepository.findAll(
      { search: input.search },
      page,
      limit,
    );

    return {
      stock: result.data,
      meta: result.meta,
    };
  }
}
