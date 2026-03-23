/**
 * Cart Controller
 *
 * Handles HTTP requests for cart endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { resolveOwner } from "../../common/resolvers/owner.resolver";
import {
  validateAddToCart,
  validateUpdateCartItem,
  validateCartItemIdParam,
} from "../../common/validators/cart.validator";
import { resolve, TOKENS } from "../../di/container";
import { ICartRepository } from "../../domain/interfaces/ICartRepository";

/**
 * Get cart repository instance
 */
function getCartRepository(): ICartRepository {
  return resolve<ICartRepository>(TOKENS.ICartRepository);
}

export const getCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const cartRepo = getCartRepository();
    const cart = await cartRepo.findAllByOwner(owner);
    sendSuccess(res, cart);
  },
);

export const addToCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const dto = validateAddToCart(req.body);
    const cartRepo = getCartRepository();
    const item = await cartRepo.upsert(owner, dto);
    sendSuccess(res, item, "Added to cart", 201);
  },
);

export const updateCartItem = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const { id } = validateCartItemIdParam(req.params);
    const { quantity } = validateUpdateCartItem(req.body);
    const cartRepo = getCartRepository();
    const item = await cartRepo.updateQuantity(id, owner, quantity);
    sendSuccess(res, item, "Cart updated");
  },
);

export const removeFromCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const { id } = validateCartItemIdParam(req.params);
    const cartRepo = getCartRepository();
    await cartRepo.remove(id, owner);
    sendSuccess(res, null, "Item removed from cart");
  },
);

export const clearCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const cartRepo = getCartRepository();
    await cartRepo.clearCart(owner);
    sendSuccess(res, null, "Cart cleared");
  },
);
