import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import { CartOwner } from "./cart.types";
import * as cartService from "./cart.service";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves cart ownership from either the authenticated user
 * or the `x-guest-id` header (a UUID generated client-side).
 */
const resolveOwner = (req: Request): CartOwner => {
  if (req.user?.id) return { userId: req.user.id };

  const guestId = req.headers["x-guest-id"];
  if (typeof guestId === "string" && UUID_REGEX.test(guestId)) {
    return { guestId };
  }

  throw new AppError(
    "A valid x-guest-id header (UUID) is required for guest cart access",
    400,
  );
};

export const getCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req);
    const cart = await cartService.getCart(owner);
    sendSuccess(res, cart);
  },
);

export const addToCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req);
    const { productId, quantity = 1 } = req.body as {
      productId: string;
      quantity: number;
    };
    if (!productId) throw new AppError("productId is required", 400);
    if (quantity < 1) throw new AppError("Quantity must be at least 1", 400);
    const item = await cartService.addToCart(owner, { productId, quantity });
    sendSuccess(res, item, "Added to cart", 201);
  },
);

export const updateCartItem = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req);
    const { quantity } = req.body as { quantity: number };
    if (!quantity || quantity < 1)
      throw new AppError("Quantity must be at least 1", 400);
    const id = String(req.params.id);
    const item = await cartService.updateCartItem(id, owner, { quantity });
    sendSuccess(res, item, "Cart updated");
  },
);

export const removeFromCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req);
    const id = String(req.params.id);
    await cartService.removeFromCart(id, owner);
    sendSuccess(res, null, "Item removed from cart");
  },
);

export const clearCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req);
    await cartService.clearCart(owner);
    sendSuccess(res, null, "Cart cleared");
  },
);
