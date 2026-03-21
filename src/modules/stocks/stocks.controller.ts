import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import {
  GetAllStockUseCase,
  GetStockByProductIdUseCase,
  GetStockStatsUseCase,
  UpdateStockUseCase,
} from "../../application/use-cases/stocks";

export const getAllStock = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const search = req.query.search as string | undefined;
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const [result, stats] = await Promise.all([
      new GetAllStockUseCase().execute({ search, page, limit }),
      new GetStockStatsUseCase().execute(),
    ]);

    sendSuccess(res, { stock: result.stock, stats, meta: result.meta });
  },
);

export const updateStock = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);
    const useCase = new UpdateStockUseCase();
    const updated = await useCase.execute({ productId, quantity: req.body.quantity });
    sendSuccess(res, updated, "Stock updated successfully");
  },
);

export const getStockByProductId = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.productId);
    const useCase = new GetStockByProductIdUseCase();
    const stock = await useCase.execute({ productId });
    sendSuccess(res, stock);
  },
);
