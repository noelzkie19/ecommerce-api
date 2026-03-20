/**
 * Image Library Controller
 *
 * Handles public image library endpoints.
 */

import { Request, Response } from "express";
import https from "node:https";
import http from "node:http";
import { catchAsync } from "../../common/utils/catchAsync";
import {
  ListImageLibrariesUseCase,
  GetImageLibraryUseCase,
} from "../../application/use-cases/image-library";
import { AppError } from "../../common/utils/AppError";

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

/**
 * Download image (public)
 * GET /api/image-library/:id/download
 */
export const downloadImage = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new GetImageLibraryUseCase();
    const image = await useCase.execute({ id });

    const imageUrl = image.imageUrl;
    if (!imageUrl) {
      throw new AppError("Image URL not found", 404);
    }

    // Parse the URL to determine protocol
    const urlObj = new URL(imageUrl);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    // Set response headers for file download
    const filename = `${image.title.replaceAll(/[^a-zA-Z0-9]/g, "_")}.jpg`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Fetch and pipe the image
    client.get(imageUrl, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          res.removeHeader("Content-Disposition");
          res.removeHeader("Content-Type");
          const redirectUrlObj = new URL(redirectUrl);
          const redirectClient =
            redirectUrlObj.protocol === "https:" ? https : http;
          redirectClient.get(redirectUrl, (redirectResponse) => {
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${filename}"`,
            );
            res.setHeader("Content-Type", "application/octet-stream");
            redirectResponse.pipe(res);
          });
        }
      } else {
        response.pipe(res);
      }
    });
  },
);
