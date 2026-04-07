/**
 * Activate Affiliate Use Case
 *
 * Activates an affiliate.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { resolve, TOKENS } from "../../../di/container";
import { SendTemplateEmailUseCase } from "../email/SendTemplateEmail";

/**
 * Input DTO for ActivateAffiliateUseCase
 */
export interface ActivateAffiliateInput {
  affiliateId: string;
}

/**
 * Output DTO for ActivateAffiliateUseCase
 */
export interface ActivateAffiliateOutput {
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
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Activate Affiliate Use Case
 */
export class ActivateAffiliateUseCase {
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
    input: ActivateAffiliateInput,
  ): Promise<ActivateAffiliateOutput> {
    const affiliate = await this.affiliateRepository.findById(
      input.affiliateId,
    );

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    if (!affiliate.canBeActivated()) {
      throw new Error(
        "Affiliate cannot be activated. Payment may not be completed.",
      );
    }

    const activated = affiliate.activate();

    // Update in repository
    await this.affiliateRepository.update(input.affiliateId, {
      status: "active",
    });

    // Send activation email (non-blocking)
    this.sendActivationEmail(
      activated.email,
      activated.name,
      activated.affiliateLink,
    ).catch((err) =>
      console.error("Failed to send affiliate activation email:", err),
    );

    return activated.toResponse();
  }

  /**
   * Send activation email to affiliate
   */
  private async sendActivationEmail(
    email: string,
    name: string,
    affiliateLink: string | null,
  ): Promise<void> {
    try {
      await this.sendTemplateEmailUseCase.execute({
        to: email,
        templateKey: "affiliate_activated",
        variables: {
          affiliate_name: name,
          affiliate_link: affiliateLink || "N/A",
          dashboard_url: `${process.env.FRONTEND_URL}/affiliate/dashboard`,
          year: new Date().getFullYear().toString(),
        },
      });
    } catch (error) {
      console.error("Error sending affiliate activation email:", error);
    }
  }
}
