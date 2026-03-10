import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import * as stockService from "./stocks.service";

export const getAllStock = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const search = req.query.search as string | undefined;
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const [{ data, meta }, stats] = await Promise.all([
      stockService.getAllStock(search, page, limit),
      stockService.getStockStats(),
    ]);

    sendSuccess(res, { stock: data, stats, meta });
  },
);

export const updateStock = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);
    const updated = await stockService.updateStock(productId, req.body);
    sendSuccess(res, updated, "Stock updated successfully");
  },
);

export const getStockByProductId = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);
    const stock = await stockService.getStockByProductId(productId);
    sendSuccess(res, stock);
  },
);
