/**
 * Record Referral Commission Use Case
 *
 * Records commission for referring a new affiliate.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { supabaseAdmin } from "../../../config/supabase";
import { resolve, TOKENS } from "../../../di/container";

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
    input: RecordReferralCommissionInput,
  ): Promise<RecordReferralCommissionOutput | null> {
    const referredAffiliate = await this.affiliateRepository.findById(
      input.referredAffiliateId,
    );

    const referrerId = referredAffiliate?.referredBy;

    if (!referrerId) {
      return null;
    }

    const settings = await this.affiliateRepository.getSettings();
    const { referralCommissionRate, referralCommissionType } = settings;

    const commissionAmount =
      referralCommissionType === "percentage"
        ? (input.paymentAmount * referralCommissionRate) / 100
        : referralCommissionRate;

    if (commissionAmount <= 0) return null;

    const referrerAffiliate =
      await this.affiliateRepository.findById(referrerId);
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
