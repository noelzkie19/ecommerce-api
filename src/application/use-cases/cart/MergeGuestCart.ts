/**
 * Merge Guest Cart Use Case
 *
 * Merges a guest cart into an authenticated user's cart.
 * Called when a guest user logs in.
 */

import { ICartRepository } from "../../../domain/interfaces/ICartRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for MergeGuestCartUseCase
 */
export interface MergeGuestCartInput {
  guestId: string;
  userId: string;
}

/**
 * Merge Guest Cart Use Case
 */
export class MergeGuestCartUseCase {
  private readonly cartRepository: ICartRepository;

  constructor(cartRepository?: ICartRepository) {
    this.cartRepository =
      cartRepository ?? resolve<ICartRepository>(TOKENS.ICartRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: MergeGuestCartInput): Promise<void> {
    await this.cartRepository.mergeGuestCart(input.guestId, input.userId);
  }
}
