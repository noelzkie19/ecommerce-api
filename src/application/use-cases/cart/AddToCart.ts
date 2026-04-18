/**
 * Add To Cart Use Case
 *
 * Adds an item to the cart.
 * Validates stock availability before adding.
 */

import {
  ICartRepository,
  CartOwner,
  AddToCartDTO,
} from "../../../domain/interfaces/ICartRepository";
import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { AppError } from "../../../common/utils/AppError";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for AddToCartUseCase
 */
export interface AddToCartInput {
  userId?: string;
  guestId?: string;
  productId: string;
  productBundleId?: string;
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
  async execute(input: AddToCartInput): Promise<AddToCartOutput> {
    const owner: CartOwner = {};
    if (input.userId) {
      owner.userId = input.userId;
    } else if (input.guestId) {
      owner.guestId = input.guestId;
    } else {
      throw new Error("Either userId or guestId is required");
    }

    // Check available stock
    const stock = await this.stockRepository.findByProductId(input.productId);
    const available = stock?.quantity ?? 0;

    if (available === 0) {
      throw new AppError("This product is out of stock", 400);
    }

    // Account for quantity already in cart
    const existing = await this.cartRepository.findItem(owner, input.productId);
    const existingQty = existing?.quantity ?? 0;
    const totalRequested = existingQty + input.quantity;

    if (totalRequested > available) {
      throw new AppError(
        `Only ${available} item(s) available in stock. You already have ${existingQty} in your cart.`,
        400,
      );
    }

    const dto: AddToCartDTO = {
      productId: input.productId,
      productBundleId: input.productBundleId,
      quantity: input.quantity,
    };

    const item = await this.cartRepository.upsert(owner, dto);

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
