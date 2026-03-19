/**
 * Image Library Controller
 *
 * Handles public image library endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import {
  ListImageLibrariesUseCase,
  GetImageLibraryUseCase,
} from "../../application/use-cases/image-library";

/**
 * List active image library items (public)
 * GET /api/image-library
 */
export const getImages = catchAsync(
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

    const useCase = new ListImageLibrariesUseCase();
    const result = await useCase.execute({
      page,
      limit,
      filters: {
        category: category as
          | "banners"
          | "gallery"
          | "testimonials"
          | "partners",
        search,
        isActive: true,
      },
    });

    res.json({ success: true, data: result.images, meta: result.meta });
  },
);

/**
 * Get image library item by ID (public)
 * GET /api/image-library/:id
 */
export const getImageById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new GetImageLibraryUseCase();
    const image = await useCase.execute({ id });
    res.json({ success: true, data: image });
  },
);
