/**
 * Update Affiliate Settings Use Case
 *
 * Updates affiliate settings.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";

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
    input: UpdateAffiliateSettingsInput,
  ): Promise<UpdateAffiliateSettingsOutput> {
    const updates: Record<string, number | string> = {};

    if (input.registrationFee !== undefined) {
      updates.registrationFee = input.registrationFee;
    }
    if (input.referralCommissionRate !== undefined) {
      updates.referralCommissionRate = input.referralCommissionRate;
    }
    if (input.referralCommissionType !== undefined) {
      updates.referralCommissionType = input.referralCommissionType;
    }

    const settings = await this.affiliateRepository.updateSettings(updates);
    return {
      registrationFee: settings.registrationFee,
      referralCommissionRate: settings.referralCommissionRate,
      referralCommissionType: settings.referralCommissionType,
    };
  }
}
