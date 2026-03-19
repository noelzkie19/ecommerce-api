/**
 * Image Library Admin Controller
 *
 * Handles admin image library management endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import {
  ListImageLibrariesUseCase,
  CreateImageLibraryUseCase,
  UpdateImageLibraryUseCase,
  DeleteImageLibraryUseCase,
} from "../../application/use-cases/image-library";

/**
 * List all image library items (admin)
 * GET /api/admin/image-library
 */
export const getImages = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { category, search, isActive } = req.query as {
      category?: string;
      search?: string;
      isActive?: string;
    };
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const parseBoolean = (value?: string): boolean | undefined => {
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    };

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
        isActive: parseBoolean(isActive),
      },
    });

    res.json({ success: true, data: result.images, meta: result.meta });
  },
);

/**
 * Create a new image library item (admin)
 * POST /api/admin/image-library
 */
export const createImage = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const useCase = new CreateImageLibraryUseCase();
    const image = await useCase.execute(req.body);
    res.status(201).json({ success: true, data: image });
  },
);

/**
 * Update an image library item (admin)
 * PATCH /api/admin/image-library/:id
 */
export const updateImage = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new UpdateImageLibraryUseCase();
    const image = await useCase.execute({ id, ...req.body });
    sendSuccess(res, image);
  },
);

/**
 * Delete an image library item (admin)
 * DELETE /api/admin/image-library/:id
 */
export const deleteImage = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new DeleteImageLibraryUseCase();
    await useCase.execute({ id });
    res.status(204).send();
  },
);
