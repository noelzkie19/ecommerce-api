/**
 * Wishlist Controller
 *
 * Handles HTTP requests for wishlist endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import {
  GetWishlistUseCase,
  AddToWishlistUseCase,
  RemoveFromWishlistUseCase,
} from "../../application/use-cases/wishlist";

export const getWishlist = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const getWishlistUseCase = new GetWishlistUseCase();
    const result = await getWishlistUseCase.execute({ userId: req.user.id });

    sendSuccess(res, result.items);
  },
);

export const addToWishlist = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { productId } = req.body as { productId: string };
    if (!productId) throw new AppError("productId is required", 400);

    const addToWishlistUseCase = new AddToWishlistUseCase();
    const item = await addToWishlistUseCase.execute({
      userId: req.user.id,
      productId,
    });

    sendSuccess(res, item, "Added to wishlist", 201);
  },
);

export const removeFromWishlist = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const id = String(req.params.id);

    const removeFromWishlistUseCase = new RemoveFromWishlistUseCase();
    await removeFromWishlistUseCase.execute({
      itemId: id,
      userId: req.user.id,
    });

    sendSuccess(res, null, "Removed from wishlist");
  },
);
