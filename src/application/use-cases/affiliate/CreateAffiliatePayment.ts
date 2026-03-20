/**
 * Create Affiliate Payment Use Case
 *
 * Creates a payment intent for affiliate registration fee.
 */

import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";
import * as paymongoUtils from "../../../utils/paymongo.utils";
import { AppError } from "../../../common/utils/AppError";

/**
 * Input DTO for CreateAffiliatePaymentUseCase
 */
export interface CreateAffiliatePaymentInput {
  userId: string;
  email: string;
  fullName: string;
  affiliateLink?: string;
}

/**
 * Output DTO for CreateAffiliatePaymentUseCase
 */
export interface CreateAffiliatePaymentOutput {
  paymentIntentId: string;
  redirectUrl: string;
  amount: number;
}

/**
 * Create Affiliate Payment Use Case
 */
export class CreateAffiliatePaymentUseCase {
  /**
   * Execute the use case
   */
  async execute(
    input: CreateAffiliatePaymentInput,
  ): Promise<CreateAffiliatePaymentOutput> {
    // Find or create affiliate record
    let affiliate = await affiliateRepository.findByUserId(input.userId);

    if (!affiliate) {
      // Create new affiliate record with pending status
      affiliate = await affiliateRepository.create({
        email: input.email,
        status: "pending",
      });
    }

    // Check if already paid
    if (affiliate.payment_status === "paid") {
      throw new AppError("Affiliate registration fee already paid", 400);
    }

    // FIX: Persist referred_by as early as possible
    if (input.affiliateLink) {
      const existingReferredBy = affiliate.referred_by ?? null;

      if (!existingReferredBy) {
        const referrer = await affiliateRepository.findByAffiliateLink(
          input.affiliateLink,
        );

        if (referrer && referrer.id !== affiliate.id) {
          await affiliateRepository.updateReferredBy(affiliate.id, referrer.id);
        }
      }
    }

    // Create payment intent for registration fee
    const registrationFee = Number.parseFloat(
      process.env.AFFILIATE_REGISTRATION_FEE || "100",
    );

    // Pass user_id and affiliate_link in metadata so webhook can identify the user and referrer
    const intent = await paymongoUtils.createPaymentIntent(registrationFee, {
      user_id: input.userId,
      type: "affiliate_registration",
      affiliate_link: input.affiliateLink || "",
    });

    // Use BACKEND_URL for payment callbacks (Express runs on port 3001)
    const backendUrl =
      process.env.BACKEND_URL ??
      `http://localhost:${process.env.PORT || "3001"}`;

    // Build the redirect URL with affiliate_link if provided
    let redirectUrl = `${backendUrl}/api/affiliates/payment/verify?intentId=${intent.intentId}&userId=${input.userId}`;
    if (input.affiliateLink) {
      redirectUrl += `&affiliateLink=${encodeURIComponent(input.affiliateLink)}`;
    }

    const { redirectUrl: paymentRedirectUrl } =
      (await paymongoUtils.attachMayaToIntent(
        intent.intentId,
        intent.clientKey,
        input.email,
        input.fullName || "",
        redirectUrl,
      )) as { redirectUrl: string };

    return {
      paymentIntentId: intent.intentId,
      redirectUrl: paymentRedirectUrl,
      amount: registrationFee,
    };
  }
}
