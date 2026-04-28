/**
 * Add Payment Proof By Admin Use Case
 *
 * Admin action to add or update payment proof for an affiliate.
 * This is used when admin needs to attach payment proof during approval
 * or as a separate admin action.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { SendTemplateEmailUseCase } from "../email/SendTemplateEmail";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for AddPaymentProofByAdminUseCase
 */
export interface AddPaymentProofByAdminInput {
  affiliateId: string;
  adminId: string;
  paymentProofUrl: string;
  paymentProofRef?: string;
}

/**
 * Output DTO for AddPaymentProofByAdminUseCase
 */
export interface AddPaymentProofByAdminOutput {
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
 * Add Payment Proof By Admin Use Case
 */
export class AddPaymentProofByAdminUseCase {
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
    input: AddPaymentProofByAdminInput,
  ): Promise<AddPaymentProofByAdminOutput> {
    const affiliate = await this.affiliateRepository.findById(
      input.affiliateId,
    );

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    // Update affiliate with payment proof and mark as paid
    const updated = await this.affiliateRepository.update(input.affiliateId, {
      paymentStatus: "paid",
      paymentProofUrl: input.paymentProofUrl,
      paymentProofRef: input.paymentProofRef ?? null,
      paymentProofSubmittedAt: new Date(),
    });

    // Send notification email to affiliate (non-blocking)
    this.sendPaymentProofNotificationEmail(updated, input.adminId).catch(
      (err) =>
        console.error("Failed to send payment proof notification email:", err),
    );

    return updated.toResponse();
  }

  /**
   * Send payment proof notification email to affiliate
   */
  private async sendPaymentProofNotificationEmail(
    affiliate: {
      id: string;
      email: string;
      name: string;
    },
    adminId: string,
  ): Promise<void> {
    try {
      await this.sendTemplateEmailUseCase.execute({
        to: affiliate.email,
        templateKey: "affiliate_payment_proof_added",
        variables: {
          affiliate_name: affiliate.name,
          affiliate_id: affiliate.id,
          admin_id: adminId,
          dashboard_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/affiliate/dashboard`,
        },
      });
    } catch (error) {
      console.error("Failed to send payment proof notification email:", error);
    }
  }
}
