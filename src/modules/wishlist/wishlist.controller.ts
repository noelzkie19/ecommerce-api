import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import { resolve, TOKENS } from "../../di/container";
import { IWishlistRepository } from "../../domain/interfaces/IWishlistRepository";

/**
 * Get wishlist repository instance
 */
function getWishlistRepository(): IWishlistRepository {
  return resolve<IWishlistRepository>(TOKENS.IWishlistRepository);
}

export const getWishlist = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const wishlistRepo = getWishlistRepository();
    const items = await wishlistRepo.findAllByUser(req.user.id);
    sendSuccess(res, items);
  },
);

export const addToWishlist = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const { productId } = req.body as { productId: string };
    if (!productId) throw new AppError("productId is required", 400);
    const wishlistRepo = getWishlistRepository();
    const item = await wishlistRepo.add(req.user.id, productId);
    sendSuccess(res, item, "Added to wishlist", 201);
  },
);

export const removeFromWishlist = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = String(req.params.id);
    const wishlistRepo = getWishlistRepository();
    await wishlistRepo.remove(id, req.user.id);
    sendSuccess(res, null, "Removed from wishlist");
  },
);
