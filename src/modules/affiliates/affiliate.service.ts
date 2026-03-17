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
  affiliateLink?: string,
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

  // ── FIX: Persist referred_by as early as possible ─────────────────────────
  // Do this at payment creation time so it's stored even if the redirect URL
  // loses the affiliateLink query param later.
  if (affiliateLink) {
    const existingReferredBy =
      affiliate.referredBy ?? affiliate.referred_by ?? null;

    if (existingReferredBy) {
      console.log(
        "[createAffiliatePayment] referred_by already set, skipping:",
        existingReferredBy,
      );
    } else {
      const referrer =
        await affiliateRepository.findByAffiliateLink(affiliateLink);

      if (referrer && referrer.id !== affiliate.id) {
        await affiliateRepository.updateReferredBy(affiliate.id, referrer.id);
        console.log(
          "[createAffiliatePayment] referred_by persisted early:",
          affiliate.id,
          "→",
          referrer.id,
        );
      } else if (!referrer) {
        console.warn(
          "[createAffiliatePayment] affiliateLink provided but no referrer found:",
          affiliateLink,
        );
      }
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Create payment intent for registration fee
  const registrationFee = Number.parseFloat(
    process.env.AFFILIATE_REGISTRATION_FEE || "100",
  );

  // Pass user_id and affiliate_link in metadata so webhook can identify the user and referrer
  const intent = await paymongoUtils.createPaymentIntent(registrationFee, {
    user_id: userId,
    type: "affiliate_registration",
    affiliate_link: affiliateLink || "",
  });

  // Use BACKEND_URL for payment callbacks (Express runs on port 3001)
  const backendUrl =
    process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT || "3001"}`;

  // Build the redirect URL with affiliate_link if provided
  let redirectUrl = `${backendUrl}/api/affiliates/payment/verify?intentId=${intent.intentId}&userId=${userId}`;
  if (affiliateLink) {
    redirectUrl += `&affiliateLink=${encodeURIComponent(affiliateLink)}`;
  }

  const { redirectUrl: paymentRedirectUrl } =
    await paymongoUtils.attachMayaToIntent(
      intent.intentId,
      intent.clientKey,
      email,
      fullName,
      redirectUrl,
    );

  return {
    paymentIntentId: intent.intentId,
    redirectUrl: paymentRedirectUrl,
    amount: registrationFee,
  };
};

// ── Credit Referrer Commission ───────────────────────────────────────────────

/**
 * Credit commission directly to a referrer affiliate by their ID.
 * Uses the current settings to calculate the commission amount.
 */
async function creditReferrerCommission(
  referrerId: string,
  registrationFee: number,
): Promise<void> {
  const settings = await affiliateRepository.getSettings();
  const { referralCommissionRate, referralCommissionType } = settings;

  const commissionAmount =
    referralCommissionType === "percentage"
      ? (registrationFee * referralCommissionRate) / 100
      : referralCommissionRate;

  console.log(
    "[Referral Commission] Calculated commission:",
    commissionAmount,
    "for referrer:",
    referrerId,
  );

  if (commissionAmount <= 0) {
    console.log("[Referral Commission] Commission is 0 or less, skipping");
    return;
  }

  try {
    const { supabaseAdmin } = await import("../../config/supabase");

    const { data: referrerData } = await supabaseAdmin
      .from("affiliates")
      .select("affiliate_commission")
      .eq("id", referrerId)
      .single();

    const currentCommission = referrerData?.affiliate_commission ?? 0;

    const { error } = await supabaseAdmin
      .from("affiliates")
      .update({
        affiliate_commission: currentCommission + commissionAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", referrerId);

    if (error) {
      console.error(
        "[Referral Commission] Failed to update commission:",
        error,
      );
      return;
    }

    console.log(
      "[Referral Commission] Successfully credited",
      commissionAmount,
      "to referrer:",
      referrerId,
      "(new total:",
      currentCommission + commissionAmount,
      ")",
    );
  } catch (error) {
    console.error("[Referral Commission] Unexpected error:", error);
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

// ── Ensure Affiliate Exists ───────────────────────────────────────────────────

/**
 * Ensure affiliate record exists, auto-creating if missing.
 * Accepts an optional affiliateLink so referred_by can be set on auto-creation.
 */
async function ensureAffiliateExists(
  userId: string,
  affiliateLink?: string,
): Promise<{
  id: string;
  paymentStatus: string;
  referredBy?: string;
  referred_by?: string;
}> {
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

      // Resolve referrer before creating so referred_by is set from the start
      let referredById: string | undefined;
      if (affiliateLink) {
        const referrer =
          await affiliateRepository.findByAffiliateLink(affiliateLink);
        if (referrer) {
          referredById = referrer.id;
          console.log(
            "[ensureAffiliateExists] Resolved referredById from affiliateLink:",
            referredById,
          );
        }
      }

      affiliate = await affiliateRepository.createForAuthUser(
        userId,
        email,
        name,
        referredById,
      );
    }

    if (!affiliate) {
      throw new AppError("Affiliate not found", 404);
    }
  }

  return affiliate;
}

// ── Find Referrer Affiliate ───────────────────────────────────────────────────

/**
 * Find the referrer affiliate based on affiliateLink param or existing referred_by field.
 * Priority: affiliateLink param → referred_by field already on the record.
 */
async function findReferrerAffiliate(
  affiliate: { id: string; referredBy?: string; referred_by?: string },
  affiliateLink?: string,
): Promise<{ id: string; [key: string]: any } | null> {
  // First try: affiliateLink query param
  if (affiliateLink) {
    console.log(
      "[findReferrerAffiliate] Looking up referrer by affiliate_link param:",
      affiliateLink,
    );
    const referrer =
      await affiliateRepository.findByAffiliateLink(affiliateLink);
    console.log(
      "[findReferrerAffiliate] Referrer found by affiliate_link:",
      referrer?.id ?? "none",
    );
    if (referrer) {
      return referrer;
    }
  }

  // Fall back: existing referred_by field (set early in createAffiliatePayment)
  const existingReferrerId =
    affiliate.referredBy ?? affiliate.referred_by ?? null;
  if (existingReferrerId) {
    console.log(
      "[findReferrerAffiliate] Falling back to existing referred_by:",
      existingReferrerId,
    );
    const referrer = await affiliateRepository.findById(existingReferrerId);
    console.log(
      "[findReferrerAffiliate] Referrer found by referred_by field:",
      referrer?.id ?? "none",
    );
    return referrer;
  }

  return null;
}

// ── Process Successful Payment ────────────────────────────────────────────────

/**
 * Process successful payment - activate affiliate and handle referral commission.
 */
async function processSuccessfulPayment(
  userId: string,
  affiliate: { id: string; referredBy?: string; referred_by?: string },
  affiliateLink?: string,
): Promise<{ success: boolean; status: string; alreadyConfirmed: boolean }> {
  console.log(
    "[processSuccessfulPayment] Payment succeeded, updating database...",
  );

  // 1. Mark as paid
  await affiliateRepository.markAsPaidByUserId(userId);
  console.log("[processSuccessfulPayment] markAsPaidByUserId complete");

  // 2. Activate the affiliate
  await affiliateRepository.activateByUserId(userId);
  console.log("[processSuccessfulPayment] activateByUserId complete");

  // 3. Generate affiliate link
  await affiliateRepository.generateAndSetAffiliateLink(userId);
  console.log(
    "[processSuccessfulPayment] generateAndSetAffiliateLink complete",
  );

  // 4. Fetch settings for commission calculation
  const settings = await affiliateRepository.getSettings();

  // ── Referral handling ──────────────────────────────────────────────────────
  // Re-fetch affiliate so we have the latest referred_by (set in createAffiliatePayment)
  const freshAffiliate = await affiliateRepository.findByUserId(userId);
  const affiliateWithReferral = freshAffiliate ?? affiliate;

  const referrerAffiliate = await findReferrerAffiliate(
    affiliateWithReferral,
    affiliateLink,
  );

  if (referrerAffiliate) {
    // Ensure referred_by is persisted (idempotent — may already be set)
    const currentReferredBy =
      affiliateWithReferral.referredBy ??
      affiliateWithReferral.referred_by ??
      null;

    if (currentReferredBy) {
      console.log(
        "[processSuccessfulPayment] referred_by already set:",
        currentReferredBy,
      );
    } else {
      console.log(
        "[processSuccessfulPayment] Setting referred_by on new affiliate:",
        affiliateWithReferral.id,
        "→",
        referrerAffiliate.id,
      );
      await affiliateRepository.updateReferredBy(
        affiliateWithReferral.id,
        referrerAffiliate.id,
      );
    }

    // Credit commission to the referrer
    console.log(
      "[processSuccessfulPayment] Crediting commission to referrer:",
      referrerAffiliate.id,
    );
    await creditReferrerCommission(
      referrerAffiliate.id,
      settings.registrationFee,
    );
  } else {
    console.log(
      "[processSuccessfulPayment] No referrer found — skipping commission",
    );
  }

  return { success: true, status: "succeeded", alreadyConfirmed: false };
}

// ── Verify Affiliate Registration Payment ───────────────────────────────────

export const verifyAffiliatePayment = async (
  intentId: string,
  userId: string,
  affiliateLink?: string,
) => {
  console.log("[verifyAffiliatePayment] Starting verification:", {
    intentId,
    userId,
    affiliateLink,
  });

  const status = await paymongoUtils.getPaymentIntentStatus(intentId);
  console.log("[verifyAffiliatePayment] PayMongo status:", status);

  // Ensure affiliate record exists (pass affiliateLink so referred_by is set on auto-create)
  const affiliate = await ensureAffiliateExists(userId, affiliateLink);

  // Already confirmed — idempotent guard
  if (affiliate.paymentStatus === "paid") {
    console.log("[verifyAffiliatePayment] Already confirmed, skipping");
    return {
      success: true,
      status: "already_confirmed",
      alreadyConfirmed: true,
    };
  }

  // Handle based on payment status
  if (status === "succeeded") {
    return processSuccessfulPayment(userId, affiliate, affiliateLink);
  }

  if (status === "payment_intent.payment_failed") {
    console.log("[verifyAffiliatePayment] Payment failed:", status);
    return { success: false, status };
  }

  console.log("[verifyAffiliatePayment] Unknown/pending status:", status);
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
 * Manually set the referrer for an affiliate (for testing/admin purposes)
 */
export const setAffiliateReferrer = async (
  affiliateId: string,
  referrerId: string,
) => affiliateRepository.updateReferredBy(affiliateId, referrerId);

/**
 * Record commission for referring a new affiliate.
 * Looks up the referrer via the referred affiliate's referred_by field,
 * then credits them the appropriate commission.
 */
export const recordReferralCommission = async (
  referredAffiliateId: string,
  paymentAmount: number,
) => {
  console.log("[Referral Commission] recordReferralCommission called:", {
    referredAffiliateId,
    paymentAmount,
  });

  const referredAffiliate =
    await affiliateRepository.findById(referredAffiliateId);
  console.log("[Referral Commission] referredAffiliate:", referredAffiliate);

  const referrerId =
    referredAffiliate?.referredBy ?? referredAffiliate?.referred_by;
  console.log("[Referral Commission] referrerId:", referrerId);

  if (!referrerId) {
    console.log("[Referral Commission] No referrerId found, returning null");
    return null;
  }

  const settings = await affiliateRepository.getSettings();
  const { referralCommissionRate, referralCommissionType } = settings;

  const commissionAmount =
    referralCommissionType === "percentage"
      ? (paymentAmount * referralCommissionRate) / 100
      : referralCommissionRate;

  console.log("[Referral Commission] Calculated commission:", commissionAmount);

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

  console.log("[Referral Commission] Successfully recorded!");
  return { referrerId, paymentAmount, commissionAmount };
};

/**
 * Manually link a referral and add commission.
 * Used by admin to fix referrals that weren't linked during registration.
 */
export const manuallyLinkReferral = async (
  referralCode: string,
  newUserId: string,
) => {
  console.log("[Manual Referral] Starting with:", { referralCode, newUserId });

  const { findByAffiliateLink, findByUserId, updateReferredBy, findByStoreId } =
    await import("../affiliates/affiliate.repository");

  let referrer = await findByAffiliateLink(referralCode);
  if (!referrer) {
    referrer = await findByStoreId(referralCode);
  }

  if (!referrer) {
    throw new AppError("Referrer not found for code: " + referralCode, 404);
  }

  console.log("[Manual Referral] Found referrer:", referrer.id);

  const newAffiliate = await findByUserId(newUserId);
  if (!newAffiliate) {
    throw new AppError("Affiliate not found for user: " + newUserId, 404);
  }

  console.log("[Manual Referral] Found new affiliate:", newAffiliate.id);

  await updateReferredBy(newAffiliate.id, referrer.id);
  console.log("[Manual Referral] Updated referred_by to:", referrer.id);

  const settings = await import("../affiliates/affiliate.repository").then(
    (r) => r.getSettings(),
  );

  const { referralCommissionRate, referralCommissionType } = settings;
  const registrationFee = settings.registrationFee;

  const commissionAmount =
    referralCommissionType === "percentage"
      ? (registrationFee * referralCommissionRate) / 100
      : referralCommissionRate;

  console.log("[Manual Referral] Commission amount:", commissionAmount);

  const { supabaseAdmin } = await import("../../config/supabase");
  const { data: currentData } = await supabaseAdmin
    .from("affiliates")
    .select("affiliate_commission")
    .eq("id", referrer.id)
    .single();

  const currentCommission = currentData?.affiliate_commission ?? 0;

  await supabaseAdmin
    .from("affiliates")
    .update({
      affiliate_commission: currentCommission + commissionAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", referrer.id);

  console.log("[Manual Referral] Commission added successfully!");

  return {
    referrerId: referrer.id,
    newAffiliateId: newAffiliate.id,
    commissionAmount,
  };
};

/**
 * Add commission to affiliate by referral code.
 * Searches affiliate by affiliate_link and credits them commission.
 */
export const addCommissionByReferralCode = async (referralCode: string) => {
  console.log("[Add Commission] Starting with referral code:", referralCode);

  const { findByAffiliateLink } =
    await import("../affiliates/affiliate.repository");

  const referrer = await findByAffiliateLink(referralCode);

  if (!referrer) {
    throw new AppError("Affiliate not found for code: " + referralCode, 404);
  }

  console.log("[Add Commission] Found affiliate:", referrer.id);

  const settings = await import("../affiliates/affiliate.repository").then(
    (r) => r.getSettings(),
  );

  const { referralCommissionRate, referralCommissionType } = settings;
  const registrationFee = settings.registrationFee;

  const commissionAmount =
    referralCommissionType === "percentage"
      ? (registrationFee * referralCommissionRate) / 100
      : referralCommissionRate;

  console.log("[Add Commission] Commission amount:", commissionAmount);

  const { supabaseAdmin } = await import("../../config/supabase");
  const { data: currentData } = await supabaseAdmin
    .from("affiliates")
    .select("affiliate_commission")
    .eq("id", referrer.id)
    .single();

  const currentCommission = currentData?.affiliate_commission ?? 0;

  await supabaseAdmin
    .from("affiliates")
    .update({
      affiliate_commission: currentCommission + commissionAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", referrer.id);

  console.log("[Add Commission] Commission added successfully!");

  return {
    affiliateId: referrer.id,
    affiliateLink: referrer.affiliate_link,
    commissionAmount,
  };
};
