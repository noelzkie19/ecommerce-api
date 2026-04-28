/**
 * Upload Payment Proof Image Use Case
 *
 * Handles uploading an image file as payment proof for an affiliate.
 * Can be used by either the affiliate themselves (via userId) or an admin (via affiliateId).
 */

import path from "node:path";
import { supabaseAdmin } from "../../../config/supabase";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";
import { AppError } from "../../../common/utils/AppError";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const BUCKET_NAME = "payment_proof";

/**
 * Input DTO for UploadPaymentProofImageUseCase
 */
export interface UploadPaymentProofImageInput {
  userId?: string; // Optional: if user uploading for themselves
  affiliateId?: string; // Optional: if admin uploading for specific affiliate
  file: Express.Multer.File;
  proofRef?: string;
}

/**
 * Output DTO for UploadPaymentProofImageUseCase
 */
export interface UploadPaymentProofImageOutput {
  success: boolean;
  message: string;
  paymentProofUrl: string;
  paymentProofRef: string | null;
  paymentProofSubmittedAt: string;
}

/**
 * Validate file type
 */
function validateFileType(mimetype: string, originalName: string): void {
  if (!ALLOWED_MIME_TYPES.has(mimetype)) {
    throw new AppError(
      `Invalid file type: ${originalName}. Only JPEG, PNG, WEBP and GIF are allowed`,
      400,
    );
  }
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToStorage(
  file: Express.Multer.File,
  affiliateId: string,
): Promise<string> {
  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = `payment-proofs/${affiliateId}/${filename}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(`Upload failed: ${error.message}`, 500);
  }

  const { data } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Upload Payment Proof Image Use Case
 */
export class UploadPaymentProofImageUseCase {
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: UploadPaymentProofImageInput,
  ): Promise<UploadPaymentProofImageOutput> {
    const { file, userId, affiliateId, proofRef } = input;

    // 1. Validate file type
    validateFileType(file.mimetype, file.originalname);

    // 2. Determine which affiliate to update
    let targetAffiliateId: string;
    let affiliate;

    if (affiliateId) {
      // Admin action: use provided affiliateId
      targetAffiliateId = affiliateId;
      affiliate = await this.affiliateRepository.findById(targetAffiliateId);
    } else if (userId) {
      // User action: look up affiliate by userId
      affiliate = await this.affiliateRepository.findByUserId(userId);
      if (!affiliate) {
        throw new AppError("Affiliate not found for this user", 404);
      }
      targetAffiliateId = affiliate.id;
    } else {
      throw new AppError("Either userId or affiliateId must be provided", 400);
    }

    if (!affiliate) {
      throw new AppError("Affiliate not found", 404);
    }

    // 3. Upload image to storage
    const imageUrl = await uploadToStorage(file, targetAffiliateId);

    // 4. Update affiliate record with payment proof and mark as paid
    await this.affiliateRepository.update(targetAffiliateId, {
      paymentStatus: "paid",
      paymentProofUrl: imageUrl,
      paymentProofRef: proofRef ?? null,
      paymentProofSubmittedAt: new Date(),
    });

    // 5. Return success
    return {
      success: true,
      message: "Payment proof uploaded successfully",
      paymentProofUrl: imageUrl,
      paymentProofRef: proofRef ?? null,
      paymentProofSubmittedAt: new Date().toISOString(),
    };
  }
}
