/**
 * Products Public Controller
 *
 * Handles public product endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import {
  ListProductsUseCase,
  GetProductUseCase,
} from "../../application/use-cases/product";

export const getProducts = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { category, search } = req.query as {
      category?: string;
      search?: string;
    };
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const useCase = new ListProductsUseCase();
    const result = await useCase.execute({
      page,
      limit,
      filters: { category, search },
    });

    res.json({ success: true, data: result.products, meta: result.meta });
  },
);

export const getProductById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new GetProductUseCase();
    const product = await useCase.execute({ productId: id });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    sendSuccess(res, product);
  },
);
