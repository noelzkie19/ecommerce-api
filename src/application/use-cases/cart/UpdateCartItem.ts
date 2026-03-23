/**
 * Update Cart Item Use Case
 *
 * Updates the quantity of an existing cart item.
 */

import { ICartRepository } from "../../../domain/interfaces/ICartRepository";
import { CartOwner } from "../../../domain/entities/CartItem";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateCartItemUseCase
 */
export interface UpdateCartItemInput {
  id: string;
  owner: CartOwner;
  quantity: number;
}

/**
 * Output DTO for UpdateCartItemUseCase
 */
export interface UpdateCartItemOutput {
  id: string;
  userId: string | null;
  guestId: string | null;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update Cart Item Use Case
 */
export class UpdateCartItemUseCase {
  private readonly cartRepository: ICartRepository;

  constructor(cartRepository?: ICartRepository) {
    this.cartRepository =
      cartRepository ?? resolve<ICartRepository>(TOKENS.ICartRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: UpdateCartItemInput): Promise<UpdateCartItemOutput> {
    const item = await this.cartRepository.updateQuantity(
      input.id,
      input.owner,
      input.quantity,
    );
    return item.toResponse();
  }
}
