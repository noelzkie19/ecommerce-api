/**
 * Update Product Use Case
 *
 * Updates an existing product.
 */

import { IProductRepository } from "../../../domain/interfaces/IProductRepository";
import { UpdateProductProps } from "../../../domain/entities/Product";
import { Currency } from "../../../domain/value-objects/Money";
import { resolve, TOKENS } from "../../../di/container";
import { isValidYouTubeUrl } from "../../../common/utils/videoValidator";

/**
 * Input DTO for UpdateProductUseCase
 */
export interface UpdateProductInput {
  productId: string;
  name?: string;
  description?: string | null;
  price?: number;
  currency?: Currency;
  category?: string;
  imageUrl?: string | null;
  badge?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  originalPrice?: number | null;
  affiliateLink?: string | null;
  videoUrl?: string | null;
  bundles?: Array<{
    name: string;
    bundleQty: number;
    bundlePrice: number;
    isActive: boolean;
  }>;
}

/**
 * Output DTO for UpdateProductUseCase
 */
export interface UpdateProductOutput {
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
  images: Array<{
    id: string;
    productId: string;
    url: string;
    position: number;
    createdAt: string | null;
  }>;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Update Product Use Case
 */
export class UpdateProductUseCase {
  private readonly productRepository: IProductRepository;

  constructor(productRepository?: IProductRepository) {
    this.productRepository =
      productRepository ??
      resolve<IProductRepository>(TOKENS.IProductRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: UpdateProductInput): Promise<UpdateProductOutput> {
    // Validate videoUrl if provided and not null
    if (input.videoUrl && input.videoUrl.length > 0) {
      if (!isValidYouTubeUrl(input.videoUrl)) {
        throw new Error(
          "Invalid YouTube URL. Please use a valid YouTube URL (youtube.com/watch?v= or youtu.be/)",
        );
      }
    }

    const updateData: Partial<UpdateProductProps> = {
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency,
      category: input.category,
      imageUrl: input.imageUrl,
      badge: input.badge,
      rating: input.rating,
      reviewCount: input.reviewCount,
      originalPrice: input.originalPrice,
      affiliateLink: input.affiliateLink,
      videoUrl: input.videoUrl,
      videoTag: input.videoUrl && input.videoUrl.length > 0 ? "default" : null,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof UpdateProductProps] === undefined) {
        delete updateData[key as keyof UpdateProductProps];
      }
    });

    await this.productRepository.update(input.productId, updateData);

    // Update bundles if provided (passing empty array clears all bundles)
    if (input.bundles !== undefined) {
      await this.productRepository.updateBundles(
        input.productId,
        input.bundles,
      );
    }

    // Reload product to get updated bundles
    const productWithBundles = await this.productRepository.findById(
      input.productId,
    );
    if (!productWithBundles) {
      throw new Error("Product not found after update");
    }

    return productWithBundles.toResponse();
  }
}
