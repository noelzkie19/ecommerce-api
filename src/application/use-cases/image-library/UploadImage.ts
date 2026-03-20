/**
 * Upload Image Use Case
 *
 * Uploads a single image file to storage.
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
 * Input DTO for UploadImageUseCase
 */
export interface UploadImageInput {
  file: Express.Multer.File;
}

/**
 * Output DTO for UploadImageUseCase
 */
export interface UploadImageOutput {
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
 * Upload image to storage
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
 * Upload Image Use Case
 */
export const uploadImage = async (
  input: UploadImageInput,
): Promise<UploadImageOutput> => {
  // Validate file
  validateFileType(input.file.mimetype, input.file.originalname);

  // Upload to storage
  const url = await uploadToStorage(input.file, "images");

  return { url };
};
