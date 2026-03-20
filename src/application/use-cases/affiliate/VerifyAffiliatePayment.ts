/**
 * Verify Affiliate Payment Use Case
 *
 * Verifies a payment intent for affiliate registration.
 */

import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";
import * as paymongoUtils from "../../../utils/paymongo.utils";

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

    if (status === "succeeded") {
      // Mark affiliate as paid
      await affiliateRepository.markAsPaidByUserId(input.userId);
      return { success: true, status };
    }

    return { success: false, status };
  }
}
