/**
 * Clear Cart Use Case
 *
 * Removes all items from the cart for the given owner.
 */

import { ICartRepository } from "../../../domain/interfaces/ICartRepository";
import { CartOwner } from "../../../domain/entities/CartItem";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ClearCartUseCase
 */
export interface ClearCartInput {
  owner: CartOwner;
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
  async execute(input: ClearCartInput): Promise<void> {
    await this.cartRepository.clearCart(input.owner);
  }
}
