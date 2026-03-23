/**
 * List Products Use Case
 *
 * Lists products with pagination and filters.
 */

import { IProductRepository } from "../../../domain/interfaces/IProductRepository";
import { ProductFilters } from "../../../domain/entities/Product";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ListProductsUseCase
 */
export interface ListProductsInput {
  page?: number;
  limit?: number;
  filters?: ProductFilters;
}

/**
 * Output DTO for ListProductsUseCase
 */
export interface ListProductsOutput {
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    priceFormatted: string;
    category: string;
    imageUrl: string | null;
    primaryImageUrl: string | null;
    badge: string | null;
    rating: number | null;
    reviewCount: number | null;
    originalPrice: number | null;
    originalPriceFormatted: string | null;
    hasDiscount: boolean;
    discountPercentage: number;
    createdAt: string | null;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * List Products Use Case
 */
export class ListProductsUseCase {
  private readonly productRepository: IProductRepository;

  constructor(productRepository?: IProductRepository) {
    this.productRepository =
      productRepository ??
      resolve<IProductRepository>(TOKENS.IProductRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: ListProductsInput): Promise<ListProductsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    const result = await this.productRepository.findAllPaginated(
      page,
      limit,
      input.filters,
    );

    return {
      products: result.data.map((product) => product.toResponse()),
      meta: result.meta,
    };
  }
}
