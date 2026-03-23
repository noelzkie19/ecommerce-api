/**
 * Manage Product Images Use Case
 *
 * Handles product image operations: add, remove, replace, reorder.
 */

import { IProductRepository } from "../../../domain/interfaces/IProductRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for adding images
 */
export interface AddProductImagesInput {
  productId: string;
  urls: string[];
}

/**
 * Input DTO for removing image
 */
export interface RemoveProductImageInput {
  imageId: string;
}

/**
 * Input DTO for replacing images
 */
export interface ReplaceProductImagesInput {
  productId: string;
  urls: string[];
}

/**
 * Input DTO for reordering images
 */
export interface ReorderProductImagesInput {
  images: Array<{ id: string; position: number }>;
}

/**
 * Output DTO for image operations
 */
export interface ProductImageOutput {
  id: string;
  productId: string;
  url: string;
  position: number;
  createdAt: string | null;
}

/**
 * Manage Product Images Use Case
 */
export class ManageProductImagesUseCase {
  private readonly productRepository: IProductRepository;

  constructor(productRepository?: IProductRepository) {
    this.productRepository =
      productRepository ??
      resolve<IProductRepository>(TOKENS.IProductRepository);
  }

  /**
   * Add images to a product
   */
  async addImages(input: AddProductImagesInput): Promise<ProductImageOutput[]> {
    // Verify product exists
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const images = await this.productRepository.addImages(
      input.productId,
      input.urls,
    );

    return images.map((img) => img.toResponse());
  }

  /**
   * Remove a single image
   */
  async removeImage(input: RemoveProductImageInput): Promise<void> {
    await this.productRepository.removeImage(input.imageId);
  }

  /**
   * Replace all images for a product
   */
  async replaceImages(
    input: ReplaceProductImagesInput,
  ): Promise<ProductImageOutput[]> {
    // Verify product exists
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Remove all existing images
    await this.productRepository.removeAllImages(input.productId);

    // Add new images
    if (input.urls.length === 0) {
      return [];
    }

    const images = await this.productRepository.addImages(
      input.productId,
      input.urls,
      0,
    );

    return images.map((img) => img.toResponse());
  }

  /**
   * Reorder images
   */
  async reorderImages(input: ReorderProductImagesInput): Promise<void> {
    await this.productRepository.reorderImages(input.images);
  }
}
