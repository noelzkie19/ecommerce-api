/**
 * Add To Cart Use Case
 *
 * Adds a product to the cart, or increases quantity if it already exists.
 */

import { ICartRepository } from "../../../domain/interfaces/ICartRepository";
import { CartOwner } from "../../../domain/entities/CartItem";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for AddToCartUseCase
 */
export interface AddToCartInput {
  owner: CartOwner;
  productId: string;
  quantity: number;
}

/**
 * Output DTO for AddToCartUseCase
 */
export interface AddToCartOutput {
  id: string;
  userId: string | null;
  guestId: string | null;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Add To Cart Use Case
 */
export class AddToCartUseCase {
  private readonly cartRepository: ICartRepository;

  constructor(cartRepository?: ICartRepository) {
    this.cartRepository =
      cartRepository ?? resolve<ICartRepository>(TOKENS.ICartRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: AddToCartInput): Promise<AddToCartOutput> {
    const item = await this.cartRepository.upsert(input.owner, {
      productId: input.productId,
      quantity: input.quantity,
    });
    return item.toResponse();
  }
}
