/**
 * Reject Affiliate Use Case
 *
 * Admin action to reject an affiliate application.
 * Sets status to 'rejected' and stores an optional reason.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { SendTemplateEmailUseCase } from "../email/SendTemplateEmail";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for RejectAffiliateUseCase
 */
export interface RejectAffiliateInput {
  affiliateId: string;
  reason?: string;
}

/**
 * Output DTO for RejectAffiliateUseCase
 */
export interface RejectAffiliateOutput {
  id: string;
  userId: string;
  email: string;
  name: string;
  status: string;
  paymentStatus: string;
  affiliateLink: string | null;
  storeId: string | null;
  pixelId: string | null;
  referredBy: string | null;
  totalSales: number;
  totalCommissions: number;
  affiliateCommission: number;
  paymentProofUrl: string | null;
  paymentProofRef: string | null;
  paymentProofSubmittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Reject Affiliate Use Case
 */
export class RejectAffiliateUseCase {
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
  async execute(input: RejectAffiliateInput): Promise<RejectAffiliateOutput> {
    const affiliate = await this.affiliateRepository.findById(
      input.affiliateId,
    );

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    // Reject the affiliate
    const rejected = await this.affiliateRepository.rejectAffiliate(
      input.affiliateId,
      input.reason,
    );

    // Send rejection email to affiliate (non-blocking)
    this.sendRejectionEmail(rejected, input.reason).catch((err) =>
      console.error("Failed to send rejection email:", err),
    );

    return rejected.toResponse();
  }

  /**
   * Send rejection email to affiliate
   */
  private async sendRejectionEmail(
    affiliate: {
      id: string;
      email: string;
      name: string;
      rejectionReason: string | null;
    },
    reason?: string,
  ): Promise<void> {
    try {
      await this.sendTemplateEmailUseCase.execute({
        to: affiliate.email,
        templateKey: "affiliate_rejected",
        variables: {
          affiliate_name: affiliate.name,
          affiliate_id: affiliate.id,
          rejection_reason:
            reason || affiliate.rejectionReason || "Not specified",
          support_email: "support@example.com",
          year: new Date().getFullYear().toString(),
        },
      });
    } catch (error) {
      console.error("Failed to send rejection email:", error);
    }
  }
}
