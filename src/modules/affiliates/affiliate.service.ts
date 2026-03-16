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

// ── Generate Affiliate Link ─────────────────────────────────────────────────

export const generateAffiliateLink = (userId: string) =>
  affiliateRepository.generateAndSetAffiliateLink(userId);

// ── Auto-create Affiliate for Auth User ──────────────────────────────────────

export const createAffiliateForAuthUser = (
  userId: string,
  email: string,
  name: string,
) => affiliateRepository.createForAuthUser(userId, email, name);

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
    `${appUrl}/api/affiliates/payment/verify?intentId=${intent.intentId}&userId=${userId}`,
  );

  return {
    paymentIntentId: intent.intentId,
    redirectUrl,
    amount: registrationFee,
  };
};

// ── Verify Affiliate Registration Payment ───────────────────────────────────

async function recordReferralCommissionIfNeeded(
  affiliate: {
    id: string;
    referred_by?: string | null;
    referredBy?: string | null;
  },
  registrationFee: number,
): Promise<void> {
  const referredBy = affiliate?.referred_by ?? affiliate?.referredBy;
  console.log(
    "Checking referral commission for affiliate",
    affiliate.id,
    "referredBy:",
    referredBy,
  );
  if (!referredBy) return;

  try {
    await recordReferralCommission(affiliate.id, registrationFee);
  } catch (error) {
    console.error("[Referral Commission] Failed:", error);
  }
}

/**
 * Helper to fire Meta Pixel Lead event for affiliate registration
 */
async function fireAffiliateRegistrationPixel(
  userId: string,
  registrationFee: number,
  pixelId: string,
  email: string,
  name: string,
  storeId: string | undefined,
): Promise<void> {
  try {
    const { buildLeadEvent } =
      await import("../affiliate-pixel/affiliate-pixel.utils");
    const { sendPixelEvent } =
      await import("../affiliate-pixel/affiliate-pixel.service");

    const event = buildLeadEvent({
      leadId: userId,
      value: registrationFee,
      currency: "PHP",
      customerEmail: email,
      customerFirstName: name,
      pixelId: pixelId,
      storeId: storeId,
      leadType: "affiliate_registration",
    });

    await sendPixelEvent(event, pixelId);
  } catch (error) {
    console.error("Failed to fire Meta Pixel Lead event:", error);
  }
}

export const verifyAffiliatePayment = async (
  intentId: string,
  userId: string,
) => {
  const status = await paymongoUtils.getPaymentIntentStatus(intentId);

  let affiliate = await affiliateRepository.findByUserId(userId);
  if (!affiliate) {
    const { supabaseAdmin } = await import("../../config/supabase");
    const { data: userData } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (userData?.user) {
      const email = userData.user.email || "";
      const name =
        userData.user.user_metadata?.full_name ||
        userData.user.user_metadata?.name ||
        email.split("@")[0];
      affiliate = await affiliateRepository.createForAuthUser(
        userId,
        email,
        name,
      );
    }
    if (!affiliate) throw new AppError("Affiliate not found", 404);
  }

  if (affiliate.paymentStatus === "paid") {
    return {
      success: true,
      status: "already_confirmed",
      alreadyConfirmed: true,
    };
  }

  if (status === "succeeded") {
    await affiliateRepository.markAsPaidByUserId(userId);
    await affiliateRepository.activateByUserId(userId);
    await affiliateRepository.generateAndSetAffiliateLink(userId);

    const settings = await affiliateRepository.getSettings();
    console.log("affiliate", affiliate);
    await recordReferralCommissionIfNeeded(affiliate, settings.registrationFee);

    return { success: true, status, alreadyConfirmed: false };
  } else if (status === "payment_intent.payment_failed") {
    return { success: false, status };
  }

  return { success: false, status };
};

// ── Affiliate Settings (Admin) ─────────────────────────────────────────────────

export const getAffiliateSettings = () => affiliateRepository.getSettings();

export const updateAffiliateSettings = async (
  registrationFee?: number,
  referralCommissionRate?: number,
  referralCommissionType?: "percentage" | "fixed",
) =>
  affiliateRepository.updateSettings(
    registrationFee,
    referralCommissionRate,
    referralCommissionType,
  );

// ── Affiliate Link ───────────────────────────────────────────────────────────

/**
 * Get affiliate's referral link
 */
export const getMyAffiliateLink = async (userId: string) => {
  const affiliate = await affiliateRepository.findByUserId(userId);
  if (!affiliate) {
    throw new AppError("Affiliate not found", 404);
  }

  const linkCode = affiliate.affiliateLink ?? null;

  if (!linkCode) {
    throw new AppError("Affiliate link not yet generated", 404);
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const affiliateLink = `${frontendUrl}/register?ref=${linkCode}`;

  return {
    affiliateLink,
    affiliateLinkCode: linkCode,
  };
};

// ── Commission Calculation for Referrals ───────────────────────────────────────

/**
 * Record commission for referring a new affiliate
 * Called when a referred affiliate completes payment
 */
export const recordReferralCommission = async (
  referredAffiliateId: string,
  paymentAmount: number,
) => {
  const referredAffiliate =
    await affiliateRepository.findById(referredAffiliateId);
  const referrerId =
    referredAffiliate?.referredBy ?? referredAffiliate?.referred_by;
  if (!referrerId) return null;

  const settings = await affiliateRepository.getSettings();
  const { referralCommissionRate, referralCommissionType } = settings;

  const commissionAmount =
    referralCommissionType === "percentage"
      ? (paymentAmount * referralCommissionRate) / 100
      : referralCommissionRate;

  if (commissionAmount <= 0) return null;

  const referrerAffiliate = await affiliateRepository.findById(referrerId);
  const currentAffiliateCommission =
    referrerAffiliate?.affiliateCommission ?? 0;

  const { supabaseAdmin } = await import("../../config/supabase");
  const { error } = await supabaseAdmin
    .from("affiliates")
    .update({
      affiliate_commission: currentAffiliateCommission + commissionAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", referrerId);

  if (error) {
    console.error("[Referral Commission] Error:", error);
    return null;
  }

  return { referrerId, paymentAmount, commissionAmount };
};
