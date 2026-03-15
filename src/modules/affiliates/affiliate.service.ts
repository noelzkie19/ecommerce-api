import * as affiliateRepository from "./affiliate.repository";
import { AppError } from "../../common/utils/AppError";
import * as paymongoUtils from "../../utils/paymongo.utils";
import {
  CreateAffiliateDTO,
  UpdateAffiliateDTO,
  AssignProductDTO,
  AffiliateStatus,
} from "./affiliate.types";

// ── Affiliates ────────────────────────────────────────────────────────────────

export const getAffiliates = (
  page: number,
  limit: number,
  search?: string,
  status?: AffiliateStatus,
) => affiliateRepository.findAllPaginated(page, limit, search, status);

export const getAffiliate = (id: string) => affiliateRepository.findById(id);

export const createAffiliate = (dto: CreateAffiliateDTO) =>
  affiliateRepository.create(dto);

export const updateAffiliate = (id: string, dto: UpdateAffiliateDTO) =>
  affiliateRepository.update(id, dto);

export const suspendAffiliate = (id: string) =>
  affiliateRepository.update(id, { status: "suspended" });

export const activateAffiliate = (id: string) =>
  affiliateRepository.update(id, { status: "active" });

export const deleteAffiliate = (id: string) => affiliateRepository.remove(id);

// ── Affiliate Products ────────────────────────────────────────────────────────

export const getAffiliateProducts = (affiliateId: string) =>
  affiliateRepository.findProductsByAffiliate(affiliateId);

export const assignProduct = async (
  affiliateId: string,
  dto: AssignProductDTO,
) => {
  // Verify affiliate exists before assigning
  await affiliateRepository.findById(affiliateId);

  if (dto.commissionValue <= 0) {
    throw new AppError("Commission value must be greater than 0", 400);
  }
  if (dto.commissionType === "percentage" && dto.commissionValue > 100) {
    throw new AppError("Percentage commission cannot exceed 100", 400);
  }

  return affiliateRepository.assignProduct(affiliateId, dto);
};

export const removeProductFromAffiliate = (
  affiliateId: string,
  productId: string,
) => affiliateRepository.removeProduct(affiliateId, productId);

// ── Affiliate Totals ───────────────────────────────────────────────────────────

export const updateAffiliateTotals = (
  affiliateId: string,
  saleAmount: number,
  commissionEarned: number,
) =>
  affiliateRepository.updateTotals(affiliateId, saleAmount, commissionEarned);

// ── Activate Affiliate by User ID ─────────────────────────────────────────────────

export const activateAffiliateByUserId = (userId: string) =>
  affiliateRepository.activateByUserId(userId);

// ── Mark Affiliate as Paid ─────────────────────────────────────────────────

export const markAffiliateAsPaidByUserId = (userId: string) =>
  affiliateRepository.markAsPaidByUserId(userId);

// ── Get Affiliate by User ID ─────────────────────────────────────────────────

export const getAffiliateByUserId = (userId: string) =>
  affiliateRepository.findByUserId(userId);

// ── Update Pixel ID for Current User ─────────────────────────────────────────

export const updateMyPixelId = (userId: string, pixelId: string) =>
  affiliateRepository.updatePixelByUserId(userId, pixelId);

// ── Create Affiliate Registration Payment ─────────────────────────────────────

export const createAffiliatePayment = async (
  userId: string,
  email: string,
  fullName: string,
) => {
  // Find or create affiliate record
  let affiliate = await affiliateRepository.findByUserId(userId);

  if (!affiliate) {
    // Create new affiliate record with pending status
    affiliate = await affiliateRepository.create({
      email,
      status: "pending",
    });
  }

  // Check if already paid
  if (affiliate.paymentStatus === "paid") {
    throw new AppError("Affiliate registration fee already paid", 400);
  }

  // Create payment intent for registration fee
  const registrationFee = Number.parseFloat(
    process.env.AFFILIATE_REGISTRATION_FEE || "100",
  );

  // Pass user_id in metadata so webhook can identify the user
  const intent = await paymongoUtils.createPaymentIntent(registrationFee, {
    user_id: userId,
    type: "affiliate_registration",
  });

  const appUrl =
    process.env.APP_URL ?? process.env.FRONTEND_URL ?? "http://localhost:3000";

  const { redirectUrl } = await paymongoUtils.attachMayaToIntent(
    intent.intentId,
    intent.clientKey,
    email,
    fullName,
    `${appUrl}/affiliate/payment/callback?intent_id=${intent.intentId}&user_id=${userId}`,
  );

  return {
    paymentIntentId: intent.intentId,
    redirectUrl,
    amount: registrationFee,
  };
};

// ── Verify Affiliate Registration Payment ───────────────────────────────────

export const verifyAffiliatePayment = async (
  intentId: string,
  userId: string,
) => {
  const status = await paymongoUtils.getPaymentIntentStatus(intentId);
  // Find the affiliate
  const affiliate = await affiliateRepository.findByUserId(userId);
  if (!affiliate) {
    throw new AppError("Affiliate not found", 404);
  }

  // Avoid double-processing already paid affiliates
  if (affiliate.paymentStatus === "paid") {
    return {
      success: true,
      status: "already_confirmed",
      alreadyConfirmed: true,
    };
  }

  if (status === "succeeded") {
    // 1. Mark affiliate as paid
    await affiliateRepository.markAsPaidByUserId(userId);

    // 2. Activate the affiliate (same as order flow)
    await affiliateRepository.activateByUserId(userId);

    // 3. Fire Meta Pixel Lead event for affiliate registration
    // Get the updated affiliate to get the pixel_id
    const updatedAffiliate = await affiliateRepository.findByUserId(userId);
    if (updatedAffiliate?.pixel_id) {
      try {
        const registrationFee = Number.parseFloat(
          process.env.AFFILIATE_REGISTRATION_FEE || "100",
        );
        // Import dynamically to avoid circular dependencies
        const { buildLeadEvent } =
          await import("../affiliate-pixel/affiliate-pixel.utils");
        const { sendPixelEvent } =
          await import("../affiliate-pixel/affiliate-pixel.service");

        const event = buildLeadEvent({
          leadId: userId,
          value: registrationFee,
          currency: "PHP",
          customerEmail: updatedAffiliate.email,
          customerFirstName: updatedAffiliate.name,
          pixelId: updatedAffiliate.pixel_id,
          storeId: updatedAffiliate.store_id,
          leadType: "affiliate_registration",
        });

        await sendPixelEvent(event, updatedAffiliate.pixel_id);
      } catch (error) {
        console.error("Failed to fire Meta Pixel Lead event:", error);
        // Don't fail the payment if pixel event fails
      }
    }

    return { success: true, status, alreadyConfirmed: false };
  } else if (status === "payment_intent.payment_failed") {
    return { success: false, status };
  }

  return { success: false, status };
};
