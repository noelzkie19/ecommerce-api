/**
 * Image Library Upload Controller
 *
 * Handles file uploads for image library (admin only).
 * Delegates to use cases for business logic.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { AppError } from "../../common/utils/AppError";
import {
  uploadImage,
  uploadThumbnail,
  uploadImageAndThumbnail,
} from "../../application/use-cases/image-library";

type MulterRequest = Request & {
  files?:
    | Express.Multer.File[]
    | Express.Multer.File[][]
    | { [fieldname: string]: Express.Multer.File[] };
};

// ---------------------------------------------------------------------------
// Upload main image
// ---------------------------------------------------------------------------

/**
 * Upload main image
 * POST /api/image-library/admin/upload-image
 */
export const uploadImageHandler = catchAsync(
  async (
    req: Request & { file?: Express.Multer.File },
    res: Response,
  ): Promise<void> => {
    if (!req.file) {
      throw new AppError("No file provided", 400);
    }

    const result = await uploadImage({ file: req.file });
    res.status(201).json({ success: true, url: result.url });
  },
);

// ---------------------------------------------------------------------------
// Upload thumbnail
// ---------------------------------------------------------------------------

/**
 * Upload thumbnail
 * POST /api/image-library/admin/upload-thumbnail
 */
export const uploadThumbnailHandler = catchAsync(
  async (
    req: Request & { file?: Express.Multer.File },
    res: Response,
  ): Promise<void> => {
    if (!req.file) {
      throw new AppError("No file provided", 400);
    }

    const result = await uploadThumbnail({ file: req.file });
    res.status(201).json({ success: true, url: result.url });
  },
);

// ---------------------------------------------------------------------------
// Upload both image and thumbnail together
// ---------------------------------------------------------------------------

/**
 * Upload both image and thumbnail
 * POST /api/image-library/admin/upload
 */
export const uploadImageAndThumbnailHandler = catchAsync(
  async (req: MulterRequest, res: Response): Promise<void> => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Support both "image" and "file" field names
    const imageFiles = files["image"] || files["file"];
    const thumbnailFiles = files["thumbnail"];

    if (!imageFiles || imageFiles.length === 0) {
      throw new AppError("No image file provided", 400);
    }

    const result = await uploadImageAndThumbnail({
      imageFile: imageFiles[0],
      thumbnailFile: thumbnailFiles?.[0],
    });

    res.status(201).json({
      success: true,
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl,
    });
  },
);
