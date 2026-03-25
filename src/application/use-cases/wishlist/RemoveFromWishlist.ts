/**
 * Remove From Wishlist Use Case
 *
 * Removes a product from the user's wishlist.
 */

import { IWishlistRepository } from "../../../domain/interfaces/IWishlistRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for RemoveFromWishlistUseCase
 */
export interface RemoveFromWishlistInput {
  itemId: string;
  userId: string;
}

/**
 * Output DTO for RemoveFromWishlistUseCase
 */
export interface RemoveFromWishlistOutput {
  success: boolean;
}

/**
 * Remove From Wishlist Use Case
 */
export class RemoveFromWishlistUseCase {
  private readonly wishlistRepository: IWishlistRepository;

  constructor(wishlistRepository?: IWishlistRepository) {
    this.wishlistRepository =
      wishlistRepository ??
      resolve<IWishlistRepository>(TOKENS.IWishlistRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: RemoveFromWishlistInput,
  ): Promise<RemoveFromWishlistOutput> {
    await this.wishlistRepository.remove(input.itemId, input.userId);
    return { success: true };
  }
}
