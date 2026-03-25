/**
 * Stocks Controller
 *
 * Handles HTTP requests for stock endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import {
  GetAllStockUseCase,
  UpdateStockUseCase,
  GetStockByProductIdUseCase,
  GetStockAvailabilityUseCase,
} from "../../application/use-cases/stocks";

export const getAllStock = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const search = req.query.search as string | undefined;
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const getAllStockUseCase = new GetAllStockUseCase();
    const result = await getAllStockUseCase.execute({ search, page, limit });

    sendSuccess(res, result);
  },
);

export const updateStock = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);
    const { quantity } = req.body;

    const updateStockUseCase = new UpdateStockUseCase();
    const updated = await updateStockUseCase.execute({ productId, quantity });

    sendSuccess(res, updated, "Stock updated successfully");
  },
);

export const getStockByProductId = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);

    const getStockByProductIdUseCase = new GetStockByProductIdUseCase();
    const stock = await getStockByProductIdUseCase.execute({ productId });

    sendSuccess(res, stock);
  },
);

export const getStockAvailability = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);

    const getStockAvailabilityUseCase = new GetStockAvailabilityUseCase();
    const result = await getStockAvailabilityUseCase.execute({ productId });

    sendSuccess(res, result);
  },
);
