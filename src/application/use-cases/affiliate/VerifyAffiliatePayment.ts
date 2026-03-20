/**
 * Verify Affiliate Payment Use Case
 *
 * Verifies a payment intent for affiliate registration.
 * - Marks affiliate as paid
 * - Auto-activates affiliate (no admin approval needed)
 * - Generates affiliate link
 * - Credits referral commission to referrer if there's a referral link
 */

import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";
import * as paymongoUtils from "../../../utils/paymongo.utils";
import { supabaseAdmin } from "../../../config/supabase";

/**
 * Input DTO for VerifyAffiliatePaymentUseCase
 */
export interface VerifyAffiliatePaymentInput {
  intentId: string;
  userId: string;
  affiliateLink?: string;
}

/**
 * Output DTO for VerifyAffiliatePaymentUseCase
 */
export interface VerifyAffiliatePaymentOutput {
  success: boolean;
  status: string;
  alreadyConfirmed?: boolean;
}

/**
 * Credit commission to referrer affiliate
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

  if (commissionAmount <= 0) {
    return;
  }

  try {
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
      console.error("Failed to credit referral commission:", error);
    }
  } catch (error) {
    console.error("Error crediting referral commission:", error);
  }
}

/**
 * Ensure affiliate record exists, auto-creating if missing
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
      throw new Error("Affiliate not found");
    }
  }

  return affiliate;
}

/**
 * Find referrer based on affiliateLink or existing referred_by
 */
async function findReferrerAffiliate(
  affiliate: { id: string; referredBy?: string; referred_by?: string },
  affiliateLink?: string,
): Promise<{ id: string; [key: string]: any } | null> {
  // First try: affiliateLink query param
  if (affiliateLink) {
    const referrer =
      await affiliateRepository.findByAffiliateLink(affiliateLink);
    if (referrer) {
      return referrer;
    }
  }

  // Fall back: existing referred_by field
  const existingReferrerId =
    affiliate.referredBy ?? affiliate.referred_by ?? null;
  if (existingReferrerId) {
    const referrer = await affiliateRepository.findById(existingReferrerId);
    return referrer;
  }

  return null;
}

/**
 * Process successful payment - activate affiliate and handle referral commission
 */
async function processSuccessfulPayment(
  userId: string,
  affiliate: { id: string; referredBy?: string; referred_by?: string },
  affiliateLink?: string,
): Promise<VerifyAffiliatePaymentOutput> {
  // 1. Mark as paid
  await affiliateRepository.markAsPaidByUserId(userId);

  // 2. Activate the affiliate (no admin approval needed)
  await affiliateRepository.activateByUserId(userId);

  // 3. Generate affiliate link
  await affiliateRepository.generateAndSetAffiliateLink(userId);

  // 4. Fetch settings for commission calculation
  const settings = await affiliateRepository.getSettings();

  // 5. Re-fetch affiliate to get latest referred_by (set in payment creation)
  const freshAffiliate = await affiliateRepository.findByUserId(userId);
  const affiliateWithReferral = freshAffiliate ?? affiliate;

  // 6. Handle referral commission
  const referrerAffiliate = await findReferrerAffiliate(
    affiliateWithReferral,
    affiliateLink,
  );

  if (referrerAffiliate) {
    // Ensure referred_by is persisted (idempotent)
    const currentReferredBy =
      affiliateWithReferral.referredBy ??
      affiliateWithReferral.referred_by ??
      null;

    if (!currentReferredBy) {
      await affiliateRepository.updateReferredBy(
        affiliateWithReferral.id,
        referrerAffiliate.id,
      );
    }

    // Credit commission to the referrer
    await creditReferrerCommission(
      referrerAffiliate.id,
      settings.registrationFee,
    );
  }

  return { success: true, status: "succeeded", alreadyConfirmed: false };
}

/**
 * Verify Affiliate Payment Use Case
 */
export class VerifyAffiliatePaymentUseCase {
  /**
   * Execute the use case
   */
  async execute(
    input: VerifyAffiliatePaymentInput,
  ): Promise<VerifyAffiliatePaymentOutput> {
    const status = await paymongoUtils.getPaymentIntentStatus(input.intentId);

    // Ensure affiliate record exists (auto-create if needed)
    const affiliate = await ensureAffiliateExists(
      input.userId,
      input.affiliateLink,
    );

    // Already confirmed - idempotent guard
    if (affiliate.paymentStatus === "paid") {
      return {
        success: true,
        status: "already_confirmed",
        alreadyConfirmed: true,
      };
    }

    if (status === "succeeded") {
      return processSuccessfulPayment(
        input.userId,
        affiliate,
        input.affiliateLink,
      );
    }

    if (status === "payment_intent.payment_failed") {
      return { success: false, status };
    }

    return { success: false, status };
  }
}
