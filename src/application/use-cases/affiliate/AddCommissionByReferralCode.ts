/**
 * Add Commission By Referral Code Use Case
 *
 * Adds commission to affiliate by referral code.
 */

import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";
import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";

/**
 * Input DTO for AddCommissionByReferralCodeUseCase
 */
export interface AddCommissionByReferralCodeInput {
  referralCode: string;
}

/**
 * Output DTO for AddCommissionByReferralCodeUseCase
 */
export interface AddCommissionByReferralCodeOutput {
  affiliateId: string;
  affiliateLink: string;
  commissionAmount: number;
}

/**
 * Add Commission By Referral Code Use Case
 */
export class AddCommissionByReferralCodeUseCase {
  /**
   * Execute the use case
   */
  async execute(
    input: AddCommissionByReferralCodeInput,
  ): Promise<AddCommissionByReferralCodeOutput> {
    const referrer = await affiliateRepository.findByAffiliateLink(
      input.referralCode,
    );

    if (!referrer) {
      throw new AppError(
        "Affiliate not found for code: " + input.referralCode,
        404,
      );
    }

    const settings = await affiliateRepository.getSettings();

    const { referralCommissionRate, referralCommissionType } = settings;
    const registrationFee = settings.registrationFee;

    const commissionAmount =
      referralCommissionType === "percentage"
        ? (registrationFee * referralCommissionRate) / 100
        : referralCommissionRate;

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

    return {
      affiliateId: referrer.id,
      affiliateLink: referrer.affiliate_link ?? "",
      commissionAmount,
    };
  }
}
