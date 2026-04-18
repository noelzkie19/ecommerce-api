/**
 * Create Product Use Case
 *
 * Creates a new product.
 */

import { IProductRepository } from "../../../domain/interfaces/IProductRepository";
import { CreateProductProps } from "../../../domain/entities/Product";
import { Currency } from "../../../domain/value-objects/Money";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for CreateProductUseCase
 */
export interface CreateProductInput {
  name: string;
  description?: string | null;
  price: number;
  currency?: Currency;
  category: string;
  imageUrl?: string | null;
  badge?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  originalPrice?: number | null;
  affiliateLink?: string | null;
  bundles?: Array<{
    name: string;
    bundleQty: number;
    bundlePrice: number;
    isActive: boolean;
  }>;
}

/**
 * Output DTO for CreateProductUseCase
 */
export interface CreateProductOutput {
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
}

/**
 * Create Product Use Case
 */
export class CreateProductUseCase {
  private readonly productRepository: IProductRepository;

  constructor(productRepository?: IProductRepository) {
    this.productRepository =
      productRepository ??
      resolve<IProductRepository>(TOKENS.IProductRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: CreateProductInput): Promise<CreateProductOutput> {
    const productProps: CreateProductProps = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency ?? "PHP",
      category: input.category,
      imageUrl: input.imageUrl,
      badge: input.badge,
      rating: input.rating,
      reviewCount: input.reviewCount,
      originalPrice: input.originalPrice,
      affiliateLink: input.affiliateLink,
    };

    const product = await this.productRepository.create(productProps);

    // Create bundles if provided
    if (input.bundles && input.bundles.length > 0) {
      const bundleProps = input.bundles.map((b) => ({
        id: crypto.randomUUID(),
        productId: product.id,
        name: b.name,
        bundleQty: b.bundleQty,
        bundlePrice: b.bundlePrice,
        isActive: b.isActive ?? true,
      }));
      await this.productRepository.createBundles(product.id, bundleProps);
    }

    // Reload product to get bundles
    const productWithBundles = await this.productRepository.findById(
      product.id,
    );
    if (!productWithBundles) {
      throw new Error("Product not found after creation");
    }

    return productWithBundles.toResponse();
  }
}
