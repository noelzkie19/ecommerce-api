/**
 * Delete Product Use Case
 *
 * Deletes a product by ID.
 */

import { IProductRepository } from "../../../domain/interfaces/IProductRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for DeleteProductUseCase
 */
export interface DeleteProductInput {
  productId: string;
}

/**
 * Delete Product Use Case
 */
export class DeleteProductUseCase {
  private readonly productRepository: IProductRepository;

  constructor(productRepository?: IProductRepository) {
    this.productRepository =
      productRepository ??
      resolve<IProductRepository>(TOKENS.IProductRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: DeleteProductInput): Promise<void> {
    // Check if product exists first
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Delete all images first
    await this.productRepository.removeAllImages(input.productId);

    // Then delete the product
    await this.productRepository.delete(input.productId);
  }
}
