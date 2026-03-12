import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import * as productsService from "./products.service";

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

    const result = await productsService.getProductsPaginated(
      { category, search },
      page,
      limit,
    );
    res.json({ success: true, data: result.data, meta: result.meta });
  },
);

export const getProductById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const product = await productsService.getProductById(id);
    sendSuccess(res, product);
  },
);
