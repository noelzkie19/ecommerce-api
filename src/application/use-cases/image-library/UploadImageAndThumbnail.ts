/**
 * Upload Image and Thumbnail Use Case
 *
 * Uploads both an image and thumbnail to storage.
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
 * Input DTO for UploadImageAndThumbnailUseCase
 */
export interface UploadImageAndThumbnailInput {
  imageFile: Express.Multer.File;
  thumbnailFile?: Express.Multer.File;
}

/**
 * Output DTO for UploadImageAndThumbnailUseCase
 */
export interface UploadImageAndThumbnailOutput {
  imageUrl: string;
  thumbnailUrl: string | null;
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
 * Upload file to storage
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
 * Upload Image and Thumbnail Use Case
 */
export const uploadImageAndThumbnail = async (
  input: UploadImageAndThumbnailInput,
): Promise<UploadImageAndThumbnailOutput> => {
  // Validate image file
  validateFileType(input.imageFile.mimetype, input.imageFile.originalname);

  // Upload image
  const imageUrl = await uploadToStorage(input.imageFile, "images");

  // Upload thumbnail if provided
  let thumbnailUrl: string | null = null;
  if (input.thumbnailFile) {
    validateFileType(
      input.thumbnailFile.mimetype,
      input.thumbnailFile.originalname,
    );
    thumbnailUrl = await uploadToStorage(input.thumbnailFile, "thumbnails");
  }

  return {
    imageUrl,
    thumbnailUrl,
  };
};
