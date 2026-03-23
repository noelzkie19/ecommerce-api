/**
 * Get All Stock Use Case
 *
 * Lists all stock entries with pagination and optional search filter.
 */

import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { resolve, TOKENS } from "../../../di/container";

export interface GetAllStockInput {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetAllStockOutput {
  stock: Array<{
    id: string;
    productId: string;
    quantity: number;
    updatedAt: string;
    product: {
      id: string;
      name: string;
      category: string;
      price: number;
      imageUrl: string | null;
    } | null;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
