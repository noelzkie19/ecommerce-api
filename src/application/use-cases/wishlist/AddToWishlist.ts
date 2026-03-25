/**
 * Add To Wishlist Use Case
 *
 * Adds a product to the user's wishlist.
 */

import { IWishlistRepository } from "../../../domain/interfaces/IWishlistRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for AddToWishlistUseCase
 */
export interface AddToWishlistInput {
  userId: string;
  productId: string;
}

/**
 * Output DTO for AddToWishlistUseCase
 */
export interface AddToWishlistOutput {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

/**
 * Add To Wishlist Use Case
 */
export class AddToWishlistUseCase {
  private readonly wishlistRepository: IWishlistRepository;

  constructor(wishlistRepository?: IWishlistRepository) {
    this.wishlistRepository =
      wishlistRepository ??
      resolve<IWishlistRepository>(TOKENS.IWishlistRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: AddToWishlistInput): Promise<AddToWishlistOutput> {
    const item = await this.wishlistRepository.add(
      input.userId,
      input.productId,
    );

    return {
      id: item.id,
      userId: item.user_id,
      productId: item.product_id,
      createdAt: item.created_at,
    };
  }
}
