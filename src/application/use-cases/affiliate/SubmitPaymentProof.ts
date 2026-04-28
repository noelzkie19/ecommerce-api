/**
 * Submit Payment Proof Use Case
 *
 * Allows an affiliate to submit proof of payment (URL and/or reference note).
 * This is part of the manual approval workflow.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";
import { SendTemplateEmailUseCase } from "../email/SendTemplateEmail";
import { env } from "../../../config/env";

/**
 * Input DTO for SubmitPaymentProofUseCase
 */
export interface SubmitPaymentProofInput {
  userId: string;
  proofUrl: string;
  proofRef?: string;
}

/**
 * Output DTO for SubmitPaymentProofUseCase
 */
export interface SubmitPaymentProofOutput {
  success: boolean;
  message: string;
  proofSubmittedAt: string;
}

/**
 * Submit Payment Proof Use Case
 *
 * Updates affiliate record with payment proof details.
 * Does NOT change status - admin still needs to approve/reject.
 */
export class SubmitPaymentProofUseCase {
  private readonly affiliateRepository: IAffiliateRepository;
  private readonly sendTemplateEmailUseCase: SendTemplateEmailUseCase;

  constructor(affiliateRepository?: IAffiliateRepository) {
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
    this.sendTemplateEmailUseCase = new SendTemplateEmailUseCase();
  }

  /**
   * Execute the use case
   */
  async execute(
    input: SubmitPaymentProofInput,
  ): Promise<SubmitPaymentProofOutput> {
    // Find affiliate by userId
    const affiliate = await this.affiliateRepository.findByUserId(input.userId);

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    // Update affiliate with payment proof and mark payment as paid
    await this.affiliateRepository.update(affiliate.id, {
      paymentProofUrl: input.proofUrl,
      paymentProofRef: input.proofRef ?? null,
      paymentProofSubmittedAt: new Date(),
      paymentStatus: "paid",
    });

    // Send notification email to admin (non-blocking)
    this.notifyAdmin(affiliate, input.proofUrl, input.proofRef).catch((err) =>
      console.error("Failed to send admin notification:", err),
    );

    return {
      success: true,
      message: "Payment proof submitted successfully. Awaiting admin approval.",
      proofSubmittedAt: new Date().toISOString(),
    };
  }

  /**
   * Notify admin that payment proof has been submitted
   */
  private async notifyAdmin(
    affiliate: { id: string; email: string; name: string },
    proofUrl: string,
    proofRef?: string,
  ): Promise<void> {
    try {
      const adminEmail = env.ADMIN_EMAIL || "admin@example.com";

      await this.sendTemplateEmailUseCase.execute({
        to: adminEmail,
        templateKey: "affiliate_payment_proof_submitted",
        variables: {
          affiliate_name: affiliate.name,
          affiliate_email: affiliate.email,
          affiliate_id: affiliate.id,
          proof_url: proofUrl,
          proof_ref: proofRef || "N/A",
          admin_dashboard_url: `${env.FRONTEND_URL || "http://localhost:5173"}/admin/affiliates`,
        },
      });
    } catch (error) {
      console.error("Failed to send admin notification email:", error);
    }
  }
}
