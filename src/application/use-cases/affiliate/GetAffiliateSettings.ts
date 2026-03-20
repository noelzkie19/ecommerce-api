/**
 * Get Affiliate Settings Use Case
 *
 * Retrieves affiliate settings.
 */

import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";

/**
 * Output DTO for GetAffiliateSettingsUseCase
 */
export interface AffiliateSettingsOutput {
  registrationFee: number;
  referralCommissionRate: number;
  referralCommissionType: "percentage" | "fixed";
}

export type GetAffiliateSettingsOutput = AffiliateSettingsOutput;

/**
 * Get Affiliate Settings Use Case
 */
export class GetAffiliateSettingsUseCase {
  /**
   * Execute the use case
   */
  async execute(): Promise<GetAffiliateSettingsOutput> {
    const settings = await affiliateRepository.getSettings();
    return {
      registrationFee: settings.registrationFee,
      referralCommissionRate: settings.referralCommissionRate,
      referralCommissionType: settings.referralCommissionType,
    };
  }
}
