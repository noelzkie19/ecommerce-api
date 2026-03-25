/**
 * Get Wishlist Use Case
 *
 * Retrieves all wishlist items for a user.
 */

import { IWishlistRepository } from "../../../domain/interfaces/IWishlistRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetWishlistUseCase
 */
export interface GetWishlistInput {
  userId: string;
}

/**
 * Output DTO for GetWishlistUseCase
 */
export interface GetWishlistOutput {
  items: any[];
}

/**
 * Get Wishlist Use Case
 */
export class GetWishlistUseCase {
  private readonly wishlistRepository: IWishlistRepository;

  constructor(wishlistRepository?: IWishlistRepository) {
    this.wishlistRepository =
      wishlistRepository ??
      resolve<IWishlistRepository>(TOKENS.IWishlistRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetWishlistInput): Promise<GetWishlistOutput> {
    const items = await this.wishlistRepository.findAllByUser(input.userId);
    return { items };
  }
}
