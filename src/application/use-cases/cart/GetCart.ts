/**
 * Get Cart Use Case
 *
 * Retrieves all cart items for a user or guest.
 */

import {
  ICartRepository,
  CartOwner,
} from "../../../domain/interfaces/ICartRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetCartUseCase
 */
export interface GetCartInput {
  userId?: string;
  guestId?: string;
}

/**
 * Output DTO for GetCartUseCase
 */
export interface GetCartOutput {
  cart: any[];
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
    const owner: CartOwner = {};
    if (input.userId) {
      owner.userId = input.userId;
    } else if (input.guestId) {
      owner.guestId = input.guestId;
    } else {
      throw new Error("Either userId or guestId is required");
    }

    const cart = await this.cartRepository.findAllByOwner(owner);
    return { cart };
  }
}
