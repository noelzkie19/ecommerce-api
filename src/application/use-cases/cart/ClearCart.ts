/**
 * Clear Cart Use Case
 *
 * Clears all items from the cart.
 */

import {
  ICartRepository,
  CartOwner,
} from "../../../domain/interfaces/ICartRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ClearCartUseCase
 */
export interface ClearCartInput {
  userId?: string;
  guestId?: string;
}

/**
 * Output DTO for ClearCartUseCase
 */
export interface ClearCartOutput {
  success: boolean;
}

/**
 * Clear Cart Use Case
 */
export class ClearCartUseCase {
  private readonly cartRepository: ICartRepository;

  constructor(cartRepository?: ICartRepository) {
    this.cartRepository =
      cartRepository ?? resolve<ICartRepository>(TOKENS.ICartRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: ClearCartInput): Promise<ClearCartOutput> {
    const owner: CartOwner = {};
    if (input.userId) {
      owner.userId = input.userId;
    } else if (input.guestId) {
      owner.guestId = input.guestId;
    } else {
      throw new Error("Either userId or guestId is required");
    }

    await this.cartRepository.clearCart(owner);
    return { success: true };
  }
}
