/**
 * Get Affiliate Settings Use Case
 *
 * Retrieves affiliate settings.
 */

import { resolve } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";

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
    const affiliateRepo = resolve<IAffiliateRepository>("IAffiliateRepository");
    const settings = await affiliateRepo.getSettings();
    return {
      registrationFee: settings.registrationFee,
      referralCommissionRate: settings.referralCommissionRate,
      referralCommissionType: settings.referralCommissionType,
    };
  }
}
