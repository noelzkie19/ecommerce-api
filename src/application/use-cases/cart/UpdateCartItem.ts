/**
 * Update Cart Item Use Case
 *
 * Updates the quantity of a cart item.
 * Validates stock availability before updating.
 */

import {
  ICartRepository,
  CartOwner,
} from "../../../domain/interfaces/ICartRepository";
import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { AppError } from "../../../common/utils/AppError";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateCartItemUseCase
 */
export interface UpdateCartItemInput {
  itemId: string;
  userId?: string;
  guestId?: string;
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
  private readonly stockRepository: IStockRepository;

  constructor(
    cartRepository?: ICartRepository,
    stockRepository?: IStockRepository,
  ) {
    this.cartRepository =
      cartRepository ?? resolve<ICartRepository>(TOKENS.ICartRepository);
    this.stockRepository =
      stockRepository ?? resolve<IStockRepository>(TOKENS.IStockRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: UpdateCartItemInput): Promise<UpdateCartItemOutput> {
    const owner: CartOwner = {};
    if (input.userId) {
      owner.userId = input.userId;
    } else if (input.guestId) {
      owner.guestId = input.guestId;
    } else {
      throw new Error("Either userId or guestId is required");
    }

    // Find the cart item to get the productId for stock lookup
    const cartItems = await this.cartRepository.findAllByOwner(owner);
    const cartItem = cartItems.find((i) => i.id === input.itemId);

    if (!cartItem) {
      throw new AppError("Cart item not found", 404);
    }

    // Validate new quantity against available stock
    const stock = await this.stockRepository.findByProductId(
      cartItem.productId,
    );
    const available = stock?.quantity ?? 0;

    if (available === 0) {
      throw new AppError("This product is out of stock", 400);
    }

    if (input.quantity > available) {
      throw new AppError(`Only ${available} item(s) available in stock`, 400);
    }

    const item = await this.cartRepository.updateQuantity(
      input.itemId,
      owner,
      input.quantity,
    );

    return {
      id: item.id,
      userId: item.userId,
      guestId: item.guestId,
      productId: item.productId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
