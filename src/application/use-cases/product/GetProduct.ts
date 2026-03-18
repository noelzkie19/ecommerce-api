/**
 * Get Product Use Case
 *
 * Retrieves a single product by ID.
 */

import { IProductRepository } from "../../../domain/interfaces/IProductRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetProductUseCase
 */
export interface GetProductInput {
  productId: string;
}

/**
 * Output DTO for GetProductUseCase
 */
export interface GetProductOutput {
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
  affiliateLink: string | null;
  hasDiscount: boolean;
  discountPercentage: number;
  images: Array<{
    id: string;
    productId: string;
    url: string;
    position: number;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get Product Use Case
 */
export class GetProductUseCase {
  private readonly productRepository: IProductRepository;

  constructor(productRepository?: IProductRepository) {
    this.productRepository =
      productRepository ??
      resolve<IProductRepository>(TOKENS.IProductRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetProductInput): Promise<GetProductOutput | null> {
    const product = await this.productRepository.findById(input.productId);

    if (!product) {
      return null;
    }

    return product.toResponse();
  }
}
