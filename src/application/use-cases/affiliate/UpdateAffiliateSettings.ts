/**
 * Update Affiliate Settings Use Case
 *
 * Updates affiliate settings.
 */

import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";

/**
 * Input DTO for UpdateAffiliateSettingsUseCase
 */
export interface UpdateAffiliateSettingsInput {
  registrationFee?: number;
  referralCommissionRate?: number;
  referralCommissionType?: "percentage" | "fixed";
}

/**
 * Output DTO for UpdateAffiliateSettingsUseCase
 */
export interface UpdateAffiliateSettingsOutput {
  registrationFee: number;
  referralCommissionRate: number;
  referralCommissionType: "percentage" | "fixed";
}

/**
 * Update Affiliate Settings Use Case
 */
export class UpdateAffiliateSettingsUseCase {
  /**
   * Execute the use case
   */
  async execute(
    input: UpdateAffiliateSettingsInput,
  ): Promise<UpdateAffiliateSettingsOutput> {
    const updates: Record<string, unknown> = {};

    if (input.registrationFee !== undefined) {
      updates.registration_fee = input.registrationFee;
    }
    if (input.referralCommissionRate !== undefined) {
      updates.referral_commission_rate = input.referralCommissionRate;
    }
    if (input.referralCommissionType !== undefined) {
      updates.referral_commission_type = input.referralCommissionType;
    }

    // Note: Need to add updateSettings to repository
    // For now, this is a placeholder that would need repository update

    const settings = await affiliateRepository.getSettings();
    return {
      registrationFee: settings.registrationFee,
      referralCommissionRate: settings.referralCommissionRate,
      referralCommissionType: settings.referralCommissionType,
    };
  }
}
