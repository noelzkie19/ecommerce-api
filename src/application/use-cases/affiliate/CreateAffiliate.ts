/**
 * Create Affiliate Use Case
 *
 * Creates a new affiliate.
 */

import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { CreateAffiliateProps } from "../../../domain/entities/Affiliate";
import { resolve, TOKENS } from "../../../di/container";
import { SendTemplateEmailUseCase } from "../email/SendTemplateEmail";

/**
 * Input DTO for CreateAffiliateUseCase
 */
export interface CreateAffiliateInput {
  userId: string;
  email: string;
  name: string;
  referredBy?: string;
}

/**
 * Output DTO for CreateAffiliateUseCase
 */
export interface CreateAffiliateOutput {
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
 * Create Affiliate Use Case
 */
export class CreateAffiliateUseCase {
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
  async execute(input: CreateAffiliateInput): Promise<CreateAffiliateOutput> {
    const affiliateProps: CreateAffiliateProps = {
      id: crypto.randomUUID(),
      userId: input.userId,
      email: input.email,
      name: input.name,
      referredBy: input.referredBy,
    };

    const affiliate = await this.affiliateRepository.create(affiliateProps);

    // Send welcome email (non-blocking)
    this.sendWelcomeEmail(input.email, input.name).catch((err) =>
      console.error("Failed to send affiliate welcome email:", err),
    );

    return affiliate.toResponse();
  }

  /**
   * Send welcome email to new affiliate
   */
  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await this.sendTemplateEmailUseCase.execute({
        to: email,
        templateKey: "affiliate_welcome",
        variables: {
          affiliate_name: name,
          year: new Date().getFullYear().toString(),
        },
      });
    } catch (error) {
      console.error("Error sending affiliate welcome email:", error);
    }
  }
}
