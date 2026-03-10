import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { supabase } from "../../config/supabase";
import { AppError } from "../../common/utils/AppError";
import path from "node:path";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILES = 10;

// ---------------------------------------------------------------------------
// Single image upload  (kept for backwards-compat)
// ---------------------------------------------------------------------------

export const uploadImage = catchAsync(
  async (
    req: Request & { file?: Express.Multer.File },
    res: Response,
  ): Promise<void> => {
    if (!req.file) throw new AppError("No file provided", 400);
    if (!ALLOWED_MIME_TYPES.has(req.file.mimetype))
      throw new AppError(
        "Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed",
        400,
      );

    const url = await uploadToStorage(req.file);
    res.status(201).json({ success: true, url });
  },
);

// ---------------------------------------------------------------------------
// Multiple image upload  POST /admin/upload-images
// ---------------------------------------------------------------------------

export const uploadImages = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const files = (req.files as Express.Multer.File[]) ?? [];

    if (files.length === 0) throw new AppError("No files provided", 400);
    if (files.length > MAX_FILES)
      throw new AppError(`Maximum ${MAX_FILES} files allowed per upload`, 400);

    const invalid = files.filter((f) => !ALLOWED_MIME_TYPES.has(f.mimetype));
    if (invalid.length > 0)
      throw new AppError(
        `Invalid file type(s): ${invalid.map((f) => f.originalname).join(", ")}. Only JPEG, PNG, WEBP and GIF are allowed`,
        400,
      );

    // Upload all files in parallel
    const urls = await Promise.all(files.map(uploadToStorage));

    res.status(201).json({ success: true, urls });
  },
);

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

async function uploadToStorage(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = `products/${filename}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new AppError(error.message, 500);

  const { data } = supabase.storage.from("products").getPublicUrl(filePath);
  return data.publicUrl;
}
