/**
 * Approve Affiliate Use Case
 *
 * Admin action to manually approve an affiliate application.
 * Sets status to 'active' and payment_status to 'paid'.
 * Generates affiliate link if not already set.
 * Optionally accepts payment proof from admin.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { SendTemplateEmailUseCase } from "../email/SendTemplateEmail";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ApproveAffiliateUseCase
 */
export interface ApproveAffiliateInput {
  affiliateId: string;
  adminId: string;
  paymentProofUrl?: string | null;
  paymentProofRef?: string | null;
}

/**
 * Output DTO for ApproveAffiliateUseCase
 */
export interface ApproveAffiliateOutput {
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
 * Approve Affiliate Use Case
 */
export class ApproveAffiliateUseCase {
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
  async execute(input: ApproveAffiliateInput): Promise<ApproveAffiliateOutput> {
    const affiliate = await this.affiliateRepository.findById(
      input.affiliateId,
    );

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    // Check if affiliate can be activated (has paid or submitted proof)
    // Note: Admin can approve even without payment proof if they're adding it during approval
    const adminProvidingProof =
      input.paymentProofUrl !== undefined && input.paymentProofUrl !== null;

    if (!affiliate.canBeActivated() && !adminProvidingProof) {
      throw new Error(
        "Affiliate cannot be approved. They must either complete payment or submit proof of payment first.",
      );
    }

    // If admin is providing payment proof during approval, update it first
    if (adminProvidingProof) {
      await this.affiliateRepository.update(input.affiliateId, {
        paymentProofUrl: input.paymentProofUrl,
        paymentProofRef: input.paymentProofRef ?? null,
        paymentProofSubmittedAt: new Date(),
      });
    }

    // Approve: set status to active, payment_status to paid, record approver
    const updated = await this.affiliateRepository.approveAffiliate(
      input.affiliateId,
      input.adminId,
    );

    // Generate affiliate link if not already set (should already be set from registration)
    if (!updated.affiliateLink) {
      await this.affiliateRepository.generateAndSetAffiliateLink(
        updated.userId,
      );
    }

    // Send approval notification email to affiliate (non-blocking)
    this.sendApprovalEmail(updated, input.paymentProofUrl).catch((err) =>
      console.error("Failed to send approval email:", err),
    );

    return updated.toResponse();
  }

  /**
   * Send approval email to affiliate
   */
  private async sendApprovalEmail(
    affiliate: {
      id: string;
      email: string;
      name: string;
      affiliateLink: string | null;
    },
    paymentProofUrl?: string | null,
  ): Promise<void> {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const affiliateLink = affiliate.affiliateLink
        ? `${frontendUrl}/register?ref=${affiliate.affiliateLink}`
        : `${frontendUrl}/affiliate/dashboard`;

      // Fetch commission rate from settings
      const settings = await this.affiliateRepository.getSettings();
      const commissionRate = settings.referralCommissionRate.toString();

      await this.sendTemplateEmailUseCase.execute({
        to: affiliate.email,
        templateKey: "affiliate_approved",
        variables: {
          affiliate_name: affiliate.name,
          affiliate_id: affiliate.id,
          affiliate_link: affiliateLink,
          commission_rate: commissionRate,
          dashboard_url: `${frontendUrl}/affiliate/dashboard`,
          payment_proof_provided: paymentProofUrl ? "yes" : "no",
          year: new Date().getFullYear().toString(),
        },
      });
    } catch (error) {
      console.error("Failed to send approval email:", error);
    }
  }
}
