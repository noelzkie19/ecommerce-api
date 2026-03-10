import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import * as productsService from "./products.service";

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

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

export const createProduct = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const product = await productsService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  },
);

export const updateProduct = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const product = await productsService.updateProduct(id, req.body);
    sendSuccess(res, product);
  },
);

export const deleteProduct = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    await productsService.deleteProduct(id);
    res.status(204).send();
  },
);

// ---------------------------------------------------------------------------
// Product images
// ---------------------------------------------------------------------------

/**
 * POST /admin/:id/images
 * Body: { urls: string[] }
 * Appends images to an existing product.
 */
export const addProductImages = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.id);
    const { urls } = req.body as { urls: string[] };

    if (!Array.isArray(urls) || urls.length === 0) {
      res
        .status(400)
        .json({ success: false, message: "urls must be a non-empty array" });
      return;
    }

    const images = await productsService.addProductImages(productId, urls);
    res.status(201).json({ success: true, data: images });
  },
);

/**
 * PUT /admin/:id/images
 * Body: { urls: string[] }
 * Replaces all images for a product with a new ordered list.
 */
export const replaceProductImages = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const productId = String(req.params.id);
    const { urls } = req.body as { urls: string[] };

    if (!Array.isArray(urls)) {
      res
        .status(400)
        .json({ success: false, message: "urls must be an array" });
      return;
    }

    const images = await productsService.replaceProductImages(productId, urls);
    res.status(200).json({ success: true, data: images });
  },
);

/**
 * PATCH /admin/:id/images/reorder
 * Body: { images: { id: string; position: number }[] }
 */
export const reorderProductImages = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { images } = req.body as {
      images: { id: string; position: number }[];
    };

    if (!Array.isArray(images) || images.length === 0) {
      res
        .status(400)
        .json({ success: false, message: "images must be a non-empty array" });
      return;
    }

    await productsService.reorderProductImages(images);
    res.status(200).json({ success: true });
  },
);

/**
 * DELETE /admin/images/:imageId
 * Deletes a single product image by its own id.
 */
export const deleteProductImage = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const imageId = String(req.params.imageId);
    await productsService.deleteProductImage(imageId);
    res.status(204).send();
  },
);
