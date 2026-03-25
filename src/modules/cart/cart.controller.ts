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
import {
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveFromCartUseCase,
  ClearCartUseCase,
} from "../../application/use-cases/cart";

export const getCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });

    const getCartUseCase = new GetCartUseCase();
    const result = await getCartUseCase.execute({
      userId: owner.userId,
      guestId: owner.guestId,
    });

    sendSuccess(res, result.cart);
  },
);

export const addToCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const dto = validateAddToCart(req.body);

    const addToCartUseCase = new AddToCartUseCase();
    const item = await addToCartUseCase.execute({
      userId: owner.userId,
      guestId: owner.guestId,
      productId: dto.productId,
      quantity: dto.quantity,
    });

    sendSuccess(res, item, "Added to cart", 201);
  },
);

export const updateCartItem = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const { id } = validateCartItemIdParam(req.params);
    const { quantity } = validateUpdateCartItem(req.body);

    const updateCartItemUseCase = new UpdateCartItemUseCase();
    const item = await updateCartItemUseCase.execute({
      itemId: id,
      userId: owner.userId,
      guestId: owner.guestId,
      quantity,
    });

    sendSuccess(res, item, "Cart updated");
  },
);

export const removeFromCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const { id } = validateCartItemIdParam(req.params);

    const removeFromCartUseCase = new RemoveFromCartUseCase();
    await removeFromCartUseCase.execute({
      itemId: id,
      userId: owner.userId,
      guestId: owner.guestId,
    });

    sendSuccess(res, null, "Item removed from cart");
  },
);

export const clearCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });

    const clearCartUseCase = new ClearCartUseCase();
    await clearCartUseCase.execute({
      userId: owner.userId,
      guestId: owner.guestId,
    });

    sendSuccess(res, null, "Cart cleared");
  },
);
