import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import * as stockRepository from "./stocks.repository";

export const getAllStock = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const search = req.query.search as string | undefined;
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const [{ data, meta }, stats] = await Promise.all([
      stockRepository.findAll({ search }, page, limit),
      stockRepository.getStats(),
    ]);

    sendSuccess(res, { stock: data, stats, meta });
  },
);

export const updateStock = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);
    const updated = await stockRepository.upsert(productId, req.body);
    sendSuccess(res, updated, "Stock updated successfully");
  },
);

export const getStockByProductId = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);
    const stock = await stockRepository.findByProductId(productId);
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
    const stock = await stockRepository.findByProductId(productId);

    // Return only availability status - not the actual quantity
    const isAvailable = stock && stock.quantity > 0;
    sendSuccess(res, { available: isAvailable });
  },
);
