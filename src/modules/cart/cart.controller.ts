import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { resolveOwner } from "../../common/resolvers/owner.resolver";
import {
  validateAddToCart,
  validateUpdateCartItem,
  validateCartItemIdParam,
} from "../../common/validators/cart.validator";
import * as cartService from "./cart.service";

export const getCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const cart = await cartService.getCart(owner);
    sendSuccess(res, cart);
  },
);

export const addToCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const dto = validateAddToCart(req.body);
    const item = await cartService.addToCart(owner, dto);
    sendSuccess(res, item, "Added to cart", 201);
  },
);

export const updateCartItem = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const { id } = validateCartItemIdParam(req.params);
    const { quantity } = validateUpdateCartItem(req.body);
    const item = await cartService.updateCartItem(id, owner, { quantity });
    sendSuccess(res, item, "Cart updated");
  },
);

export const removeFromCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const { id } = validateCartItemIdParam(req.params);
    await cartService.removeFromCart(id, owner);
    sendSuccess(res, null, "Item removed from cart");
  },
);

export const clearCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    await cartService.clearCart(owner);
    sendSuccess(res, null, "Cart cleared");
  },
);
