/**
 * Remove From Cart Use Case
 *
 * Removes a single item from the cart by ID.
 */

import { ICartRepository } from "../../../domain/interfaces/ICartRepository";
import { CartOwner } from "../../../domain/entities/CartItem";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for RemoveFromCartUseCase
 */
export interface RemoveFromCartInput {
  id: string;
  owner: CartOwner;
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
  async execute(input: RemoveFromCartInput): Promise<void> {
    await this.cartRepository.remove(input.id, input.owner);
  }
}
