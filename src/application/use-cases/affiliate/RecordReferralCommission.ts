/**
 * Record Referral Commission Use Case
 *
 * Records commission for referring a new affiliate.
 */

import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";
import { supabaseAdmin } from "../../../config/supabase";

/**
 * Input DTO for RecordReferralCommissionUseCase
 */
export interface RecordReferralCommissionInput {
  referredAffiliateId: string;
  paymentAmount: number;
}

/**
 * Output DTO for RecordReferralCommissionUseCase
 */
export interface RecordReferralCommissionOutput {
  affiliateId: string;
  commissionAmount: number;
}

/**
 * Record Referral Commission Use Case
 */
export class RecordReferralCommissionUseCase {
  /**
   * Execute the use case
   */
  async execute(
    input: RecordReferralCommissionInput,
  ): Promise<RecordReferralCommissionOutput | null> {
    const referredAffiliate = await affiliateRepository.findById(
      input.referredAffiliateId,
    );

    const referrerId =
      referredAffiliate?.referredBy ?? referredAffiliate?.referred_by;

    if (!referrerId) {
      return null;
    }

    const settings = await affiliateRepository.getSettings();
    const { referralCommissionRate, referralCommissionType } = settings;

    const commissionAmount =
      referralCommissionType === "percentage"
        ? (input.paymentAmount * referralCommissionRate) / 100
        : referralCommissionRate;

    if (commissionAmount <= 0) return null;

    const referrerAffiliate = await affiliateRepository.findById(referrerId);
    const currentAffiliateCommission =
      referrerAffiliate?.affiliateCommission ?? 0;

    const { error } = await supabaseAdmin
      .from("affiliates")
      .update({
        affiliate_commission: currentAffiliateCommission + commissionAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", referrerId);

    if (error) {
      return null;
    }

    return {
      affiliateId: referrerId,
      commissionAmount,
    };
  }
}
