/**
 * Create Affiliate Payment Use Case
 *
 * Creates a payment intent for affiliate registration fee.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { CreateAffiliateProps } from "../../../domain/entities/Affiliate";

import { resolve, TOKENS } from "../../../di/container";

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
    input: CreateAffiliatePaymentInput,
  ): Promise<CreateAffiliatePaymentOutput> {
    // DEPRECATED: PayMongo payment system removed
    // Affiliate registration now uses manual approval process
    // Affiliates should submit proof of payment directly to admin

    // Still ensure affiliate exists (for backward compatibility)
    let affiliate = await this.affiliateRepository.findByUserId(input.userId);
    if (!affiliate) {
      const createProps: CreateAffiliateProps = {
        id: crypto.randomUUID(),
        userId: input.userId,
        email: input.email,
        name: input.fullName || input.email.split("@")[0],
        status: "pending",
        paymentStatus: "unpaid",
      };
      affiliate = await this.affiliateRepository.create(createProps);
    }

    // Handle referral linking if provided
    if (input.affiliateLink) {
      const existingReferredBy = affiliate.referredBy;
      if (!existingReferredBy) {
        const referrer = await this.affiliateRepository.findByAffiliateLink(
          input.affiliateLink,
        );
        if (referrer && referrer.id !== affiliate.id) {
          await this.affiliateRepository.updateReferredBy(
            affiliate.id,
            referrer.id,
          );
        }
      }
    }

    throw new Error(
      "Payment system deprecated. Affiliate registration now uses manual approval. " +
        "Please submit proof of payment to admin for approval.",
    );
  }
}
