import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { resolve, TOKENS } from "../../di/container";
import { IStockRepository } from "../../domain/interfaces/IStockRepository";

/**
 * Get stock repository instance
 */
function getStockRepository(): IStockRepository {
  return resolve<IStockRepository>(TOKENS.IStockRepository);
}

export const getAllStock = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const search = req.query.search as string | undefined;
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const stockRepo = getStockRepository();
    const [{ data, meta }, stats] = await Promise.all([
      stockRepo.findAll({ search }, page, limit),
      stockRepo.getStats(),
    ]);

    sendSuccess(res, { stock: data, stats, meta });
  },
);

export const updateStock = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);
    const stockRepo = getStockRepository();
    const updated = await stockRepo.upsert(productId, req.body);
    sendSuccess(res, updated, "Stock updated successfully");
  },
);

export const getStockByProductId = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);
    const stockRepo = getStockRepository();
    const stock = await stockRepo.findByProductId(productId);
    sendSuccess(res, stock);
  },
);

/**
 * Public endpoint to get stock availability for a product
 * Returns just whether the product is in stock (no quantity)
 */
export const getStockAvailability = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);
    const stockRepo = getStockRepository();
    const stock = await stockRepo.findByProductId(productId);

    // Return only availability status - not the actual quantity
    const isAvailable = stock && stock.quantity > 0;
    sendSuccess(res, { available: isAvailable });
  },
);
