/**
 * Add Commission By Referral Code Use Case
 *
 * Adds commission to affiliate by referral code.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { supabaseAdmin } from "../../../config/supabase";
import { resolve, TOKENS } from "../../../di/container";

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
    input: AddCommissionByReferralCodeInput,
  ): Promise<AddCommissionByReferralCodeOutput> {
    const referrer = await this.affiliateRepository.findByAffiliateLink(
      input.referralCode,
    );

    if (!referrer) {
      throw new Error("Affiliate not found for code: " + input.referralCode);
    }

    const settings = await this.affiliateRepository.getSettings();

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
      affiliateLink: referrer.affiliateLink ?? "",
      commissionAmount,
    };
  }
}
