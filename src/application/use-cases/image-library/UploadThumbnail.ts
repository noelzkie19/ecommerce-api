/**
 * Upload Thumbnail Use Case
 *
 * Uploads a thumbnail image file to storage.
 */

import path from "node:path";
import { supabaseAdmin } from "../../../config/supabase";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const BUCKET_NAME = "products";

/**
 * Input DTO for UploadThumbnailUseCase
 */
export interface UploadThumbnailInput {
  file: Express.Multer.File;
}

/**
 * Output DTO for UploadThumbnailUseCase
 */
export interface UploadThumbnailOutput {
  url: string;
}

/**
 * Validate file type
 */
function validateFileType(mimetype: string, originalName: string): void {
  if (!ALLOWED_MIME_TYPES.has(mimetype)) {
    throw new Error(
      `Invalid file type: ${originalName}. Only JPEG, PNG, WEBP and GIF are allowed`,
    );
  }
}

/**
 * Upload thumbnail to storage
 */
async function uploadToStorage(
  file: Express.Multer.File,
  folder: string,
): Promise<string> {
  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = `${folder}/${filename}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Upload Thumbnail Use Case
 */
export const uploadThumbnail = async (
  input: UploadThumbnailInput,
): Promise<UploadThumbnailOutput> => {
  // Validate file
  validateFileType(input.file.mimetype, input.file.originalname);

  // Upload to storage
  const url = await uploadToStorage(input.file, "thumbnails");

  return { url };
};
