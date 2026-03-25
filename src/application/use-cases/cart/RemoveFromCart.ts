/**
 * Remove From Cart Use Case
 *
 * Removes an item from the cart.
 */

import {
  ICartRepository,
  CartOwner,
} from "../../../domain/interfaces/ICartRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for RemoveFromCartUseCase
 */
export interface RemoveFromCartInput {
  itemId: string;
  userId?: string;
  guestId?: string;
}

/**
 * Output DTO for RemoveFromCartUseCase
 */
export interface RemoveFromCartOutput {
  success: boolean;
}

/**
 * Remove From Cart Use Case
 */
export class RemoveFromCartUseCase {
  private readonly cartRepository: ICartRepository;

  constructor(cartRepository?: ICartRepository) {
    this.cartRepository =
      cartRepository ?? resolve<ICartRepository>(TOKENS.ICartRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: RemoveFromCartInput): Promise<RemoveFromCartOutput> {
    const owner: CartOwner = {};
    if (input.userId) {
      owner.userId = input.userId;
    } else if (input.guestId) {
      owner.guestId = input.guestId;
    } else {
      throw new Error("Either userId or guestId is required");
    }

    await this.cartRepository.remove(input.itemId, owner);
    return { success: true };
  }
}
