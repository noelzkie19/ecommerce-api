/**
 * Get Cart Use Case
 *
 * Retrieves all cart items for the current owner, with product details.
 */

import { ICartRepository } from "../../../domain/interfaces/ICartRepository";
import {
  CartOwner,
  CartItemWithProductResponse,
} from "../../../domain/entities/CartItem";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetCartUseCase
 */
export interface GetCartInput {
  owner: CartOwner;
}

/**
 * Output DTO for GetCartUseCase
 */
export interface GetCartOutput {
  items: CartItemWithProductResponse[];
}

/**
 * Get Cart Use Case
 */
export class GetCartUseCase {
  private readonly cartRepository: ICartRepository;

  constructor(cartRepository?: ICartRepository) {
    this.cartRepository =
      cartRepository ?? resolve<ICartRepository>(TOKENS.ICartRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetCartInput): Promise<GetCartOutput> {
    const items = await this.cartRepository.findAllByOwner(input.owner);
    return { items: items.map((item) => item.toDetailedResponse()) };
  }
}
